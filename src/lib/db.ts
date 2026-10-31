// @ts-ignore
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

export interface PadRecord {
  slug: string;
  encrypted_content: string;
  content_hash: string;
  version: number;
  expires_at: number | null;
  burn_after_read: number;
  view_count: number;
  created_at: number;
  updated_at: number;
}

// Global database instance caching for Next.js hot reload
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
      content_hash TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      expires_at INTEGER,
      burn_after_read INTEGER NOT NULL DEFAULT 0,
      view_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pads_expires_at ON pads (expires_at);
  `);

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

  // Burn after read: if already viewed once, it is expired/burned
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
  initHash,
  currentHash,
  expiresAt,
  burnAfterRead,
}: {
  slug: string;
  encryptedContent: string;
  initHash?: string;
  currentHash: string;
  expiresAt?: number | null;
  burnAfterRead?: boolean;
}): { success: boolean; version: number } {
  const db = getDatabase();
  const selectStmt = db.prepare('SELECT * FROM pads WHERE slug = ?');
  const existing = selectStmt.get(slug) as unknown as PadRecord | undefined;

  const now = Date.now();
  const burnFlag = burnAfterRead ? 1 : 0;
  const expiry = expiresAt && expiresAt > 0 ? expiresAt : null;

  if (existing) {
    // Concurrency / write authorization check
    if (initHash && existing.content_hash !== initHash) {
      throw new Error('CONCURRENCY_CONFLICT: Pad has been modified by another session or incorrect proof.');
    }

    const nextVersion = existing.version + 1;
    const updateStmt = db.prepare(`
      UPDATE pads SET 
        encrypted_content = ?, 
        content_hash = ?, 
        version = ?, 
        expires_at = ?, 
        burn_after_read = ?, 
        updated_at = ?
      WHERE slug = ?
    `);

    updateStmt.run(
      encryptedContent,
      currentHash,
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
        content_hash, 
        version, 
        expires_at, 
        burn_after_read, 
        view_count, 
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, 1, ?, ?, 0, ?, ?)
    `);

    insertStmt.run(
      slug,
      encryptedContent,
      currentHash,
      expiry,
      burnFlag,
      now,
      now
    );

    return { success: true, version: 1 };
  }
}

export function deletePad(slug: string, initHash: string): boolean {
  const db = getDatabase();
  const selectStmt = db.prepare('SELECT * FROM pads WHERE slug = ?');
  const existing = selectStmt.get(slug) as unknown as PadRecord | undefined;

  if (!existing) {
    return false;
  }

  if (existing.content_hash !== initHash) {
    throw new Error('AUTHORIZATION_FAILED: Invalid write permission proof for deletion.');
  }

  const deleteStmt = db.prepare('DELETE FROM pads WHERE slug = ?');
  deleteStmt.run(slug);
  return true;
}
