// @ts-ignore
import { DatabaseSync } from 'node:sqlite';
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

const globalForDb = global as unknown as { dbInstance?: DatabaseSync };

function getDatabase(): DatabaseSync {
  if (globalForDb.dbInstance) {
    return globalForDb.dbInstance;
  }

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'codedpad.db');
  const db = new DatabaseSync(dbPath);

  // Initialize schema
  db.exec(`
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
    );
    CREATE INDEX IF NOT EXISTS idx_pads_expires_at ON pads (expires_at);
  `);

  // Migrate columns if needed
  try {
    const tableInfo = db.prepare("PRAGMA table_info('pads')").all() as any[];
    const hasAuthHash = tableInfo.some((col: any) => col.name === 'auth_hash');
    if (!hasAuthHash) {
      db.exec("ALTER TABLE pads ADD COLUMN auth_hash TEXT NOT NULL DEFAULT ''");
    }
  } catch (err) {
    console.error('Migration notice:', err);
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.dbInstance = db;
  }

  return db;
}

export function getPad(slug: string): PadRecord | null {
  const db = getDatabase();
  const selectStmt = db.prepare('SELECT * FROM pads WHERE slug = ?');
  const row = selectStmt.get(slug) as unknown as PadRecord | undefined;

  if (!row) {
    return null;
  }

  const now = Date.now();

  // Expired check
  if (row.expires_at !== null && row.expires_at > 0 && row.expires_at < now) {
    const deleteStmt = db.prepare('DELETE FROM pads WHERE slug = ?');
    deleteStmt.run(slug);
    return null;
  }

  // Burn after read check: if already viewed once, it is expired/burned
  if (row.burn_after_read === 1 && row.view_count >= 1) {
    const deleteStmt = db.prepare('DELETE FROM pads WHERE slug = ?');
    deleteStmt.run(slug);
    return null;
  }

  // Increment view count
  const updateViewStmt = db.prepare('UPDATE pads SET view_count = view_count + 1 WHERE slug = ?');
  updateViewStmt.run(slug);

  return row;
}

export function savePad({
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
}): { success: boolean; version: number } {
  const db = getDatabase();
  const selectStmt = db.prepare('SELECT * FROM pads WHERE slug = ?');
  const existing = selectStmt.get(slug) as unknown as PadRecord | undefined;

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
    if (expectedVersion !== undefined && expectedVersion > 0 && existing.version !== expectedVersion) {
      throw new Error(`CONCURRENCY_CONFLICT: Pad was updated by another session. Stored version is ${existing.version}, but you are saving against version ${expectedVersion}.`);
    }

    const nextVersion = existing.version + 1;
    const updateStmt = db.prepare(`
      UPDATE pads SET 
        encrypted_content = ?, 
        auth_hash = ?,
        content_hash = ?,
        version = ?, 
        expires_at = ?, 
        burn_after_read = ?, 
        updated_at = ?
      WHERE slug = ?
    `);

    updateStmt.run(
      encryptedContent,
      serverAuthHash,
      serverAuthHash,
      nextVersion,
      expiry,
      burnFlag,
      now,
      slug
    );

    return { success: true, version: nextVersion };
  } else {
    // New pad creation
    const insertStmt = db.prepare(`
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
    `);

    insertStmt.run(
      slug,
      encryptedContent,
      serverAuthHash,
      serverAuthHash,
      expiry,
      burnFlag,
      now,
      now
    );

    return { success: true, version: 1 };
  }
}

export function deletePad(slug: string, authProof: string): boolean {
  const db = getDatabase();
  const selectStmt = db.prepare('SELECT * FROM pads WHERE slug = ?');
  const existing = selectStmt.get(slug) as unknown as PadRecord | undefined;

  if (!existing) {
    return false;
  }

  const serverAuthHash = hashProof(authProof);
  if (existing.auth_hash && existing.auth_hash !== serverAuthHash) {
    throw new Error('AUTH_FAILED: Incorrect passphrase for pad deletion.');
  }

  const deleteStmt = db.prepare('DELETE FROM pads WHERE slug = ?');
  deleteStmt.run(slug);
  return true;
}
