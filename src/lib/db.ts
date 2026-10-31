import { createClient, Client } from '@libsql/client';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface PadRecord {
  slug: string;
  encrypted_content: string;
  auth_hash: string;
  content_hash: string;
  version: number;
  expires_at: number | null;
  burn_after_read: number;
  view_count: number;
  created_at: number;
  updated_at: number;
}

export function hashProof(proof: string): string {
  return crypto.createHash('sha256').update(proof).digest('hex');
}

const globalForDb = global as unknown as { dbClient?: Client; initPromise?: Promise<void> };

function getClient(): Client {
  if (globalForDb.dbClient) {
    return globalForDb.dbClient;
  }

  const url = process.env.TURSO_DATABASE_URL || 'file:data/codedpad.db';
  const authToken = process.env.TURSO_AUTH_TOKEN;

  // If local file path, ensure directory exists
  if (url.startsWith('file:') && typeof process !== 'undefined') {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // ignore
      }
    }
  }

  const client = createClient({
    url,
    authToken,
  });

  globalForDb.dbClient = client;
  return client;
}

let isInitialized = false;
async function ensureSchema(client: Client): Promise<void> {
  if (isInitialized) return;
  if (globalForDb.initPromise) {
    return globalForDb.initPromise;
  }

  globalForDb.initPromise = (async () => {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS pads (
        slug TEXT PRIMARY KEY,
        encrypted_content TEXT NOT NULL,
        auth_hash TEXT NOT NULL DEFAULT '',
        content_hash TEXT NOT NULL DEFAULT '',
        version INTEGER NOT NULL DEFAULT 1,
        expires_at INTEGER,
        burn_after_read INTEGER NOT NULL DEFAULT 0,
        view_count INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    try {
      await client.execute(`
        CREATE INDEX IF NOT EXISTS idx_pads_expires_at ON pads (expires_at)
      `);
    } catch {
      // index might exist
    }

    isInitialized = true;
  })();

  return globalForDb.initPromise;
}

export async function getPad(slug: string): Promise<PadRecord | null> {
  const client = getClient();
  await ensureSchema(client);

  const res = await client.execute({
    sql: 'SELECT * FROM pads WHERE slug = ?',
    args: [slug],
  });

  if (!res.rows.length) {
    return null;
  }

  const row = res.rows[0] as unknown as PadRecord;
  const now = Date.now();

  // Expired check
  if (row.expires_at !== null && row.expires_at > 0 && row.expires_at < now) {
    await client.execute({
      sql: 'DELETE FROM pads WHERE slug = ?',
      args: [slug],
    });
    return null;
  }

  // Burn after read check: if already viewed once, it is burned
  if (Number(row.burn_after_read) === 1 && Number(row.view_count) >= 1) {
    await client.execute({
      sql: 'DELETE FROM pads WHERE slug = ?',
      args: [slug],
    });
    return null;
  }

  // Increment view count
  await client.execute({
    sql: 'UPDATE pads SET view_count = view_count + 1 WHERE slug = ?',
    args: [slug],
  });

  return row;
}

export async function savePad({
  slug,
  encryptedContent,
  authProof,
  expectedVersion,
  expiresAt,
  burnAfterRead,
}: {
  slug: string;
  encryptedContent: string;
  authProof: string;
  expectedVersion?: number;
  expiresAt?: number | null;
  burnAfterRead?: boolean;
}): Promise<{ success: boolean; version: number }> {
  const client = getClient();
  await ensureSchema(client);

  const res = await client.execute({
    sql: 'SELECT * FROM pads WHERE slug = ?',
    args: [slug],
  });

  const existing = (res.rows[0] as unknown as PadRecord) || undefined;
  const now = Date.now();
  const burnFlag = burnAfterRead ? 1 : 0;
  const expiry = expiresAt && expiresAt > 0 ? expiresAt : null;
  const serverAuthHash = hashProof(authProof);

  if (existing) {
    // 1. Zero-Knowledge Authorization Check
    if (existing.auth_hash && existing.auth_hash !== serverAuthHash) {
      throw new Error('AUTH_FAILED: Incorrect passphrase for this pad.');
    }

    // 2. Optimistic Concurrency Control Check
    if (expectedVersion !== undefined && expectedVersion > 0 && Number(existing.version) !== expectedVersion) {
      throw new Error(
        `CONCURRENCY_CONFLICT: Pad was updated by another session. Stored version is ${existing.version}, but you are saving against version ${expectedVersion}.`
      );
    }

    const nextVersion = Number(existing.version) + 1;
    await client.execute({
      sql: `
        UPDATE pads SET 
          encrypted_content = ?, 
          auth_hash = ?,
          content_hash = ?,
          version = ?, 
          expires_at = ?, 
          burn_after_read = ?, 
          updated_at = ?
        WHERE slug = ?
      `,
      args: [
        encryptedContent,
        serverAuthHash,
        serverAuthHash,
        nextVersion,
        expiry,
        burnFlag,
        now,
        slug,
      ],
    });

    return { success: true, version: nextVersion };
  } else {
    // New pad creation
    await client.execute({
      sql: `
        INSERT INTO pads (
          slug, 
          encrypted_content, 
          auth_hash, 
          content_hash,
          version, 
          expires_at, 
          burn_after_read, 
          view_count, 
          created_at, 
          updated_at
        ) VALUES (?, ?, ?, ?, 1, ?, ?, 0, ?, ?)
      `,
      args: [
        slug,
        encryptedContent,
        serverAuthHash,
        serverAuthHash,
        expiry,
        burnFlag,
        now,
        now,
      ],
    });

    return { success: true, version: 1 };
  }
}

export async function deletePad(slug: string, authProof: string): Promise<boolean> {
  const client = getClient();
  await ensureSchema(client);

  const res = await client.execute({
    sql: 'SELECT * FROM pads WHERE slug = ?',
    args: [slug],
  });

  const existing = (res.rows[0] as unknown as PadRecord) || undefined;
  if (!existing) {
    return false;
  }

  const serverAuthHash = hashProof(authProof);
  if (existing.auth_hash && existing.auth_hash !== serverAuthHash) {
    throw new Error('AUTH_FAILED: Incorrect passphrase for pad deletion.');
  }

  await client.execute({
    sql: 'DELETE FROM pads WHERE slug = ?',
    args: [slug],
  });

  return true;
}
