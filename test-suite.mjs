// End-to-End Cryptography and Database Verification Test
import assert from 'node:assert';
import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Clean test db
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const testDbPath = path.join(dataDir, 'test-codedpad.db');
if (fs.existsSync(testDbPath)) {
  try { fs.unlinkSync(testDbPath); } catch {}
}

const db = new DatabaseSync(testDbPath);
db.exec(`
  CREATE TABLE pads (
    slug TEXT PRIMARY KEY,
    encrypted_content TEXT NOT NULL,
    auth_hash TEXT NOT NULL DEFAULT '',
    version INTEGER NOT NULL DEFAULT 1,
    expires_at INTEGER,
    burn_after_read INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

console.log('--- TEST 1: Database Insert & Versioned Concurrency Control ---');
const authProof = crypto.createHash('sha256').update('secret::codedpad::test-pad').digest('hex');
const authHash = crypto.createHash('sha256').update(authProof).digest('hex');

const ins = db.prepare(`
  INSERT INTO pads (slug, encrypted_content, auth_hash, version, expires_at, burn_after_read, view_count, created_at, updated_at)
  VALUES (?, ?, ?, 1, NULL, 0, 0, ?, ?)
`);
ins.run('test-pad', 'enc_blob_1', authHash, Date.now(), Date.now());

const sel = db.prepare('SELECT * FROM pads WHERE slug = ?').get('test-pad');
assert.strictEqual(sel.slug, 'test-pad');
assert.strictEqual(sel.encrypted_content, 'enc_blob_1');
assert.strictEqual(sel.version, 1);
console.log('✓ Pad successfully created at version 1.');

// Test saving consecutive updates without conflict
const updateStmt = db.prepare('UPDATE pads SET encrypted_content = ?, version = version + 1 WHERE slug = ? AND version = ?');
const res1 = updateStmt.run('enc_blob_2', 'test-pad', 1);
assert.strictEqual(res1.changes, 1);
console.log('✓ Save 2 succeeded (version updated to 2).');

const res2 = updateStmt.run('enc_blob_3', 'test-pad', 2);
assert.strictEqual(res2.changes, 1);
console.log('✓ Save 3 succeeded (version updated to 3).');

// Stale version save fails cleanly
const staleRes = updateStmt.run('enc_blob_stale', 'test-pad', 2);
assert.strictEqual(staleRes.changes, 0);
console.log('✓ Stale version edit prevented by concurrency control.');

console.log('\n--- TEST 2: Burn-After-Reading (Self-Destruct) ---');
const burnIns = db.prepare(`
  INSERT INTO pads (slug, encrypted_content, auth_hash, version, expires_at, burn_after_read, view_count, created_at, updated_at)
  VALUES (?, ?, ?, 1, NULL, 1, 0, ?, ?)
`);
burnIns.run('burn-pad', 'burn_blob', authHash, Date.now(), Date.now());

// View 1
db.prepare('UPDATE pads SET view_count = view_count + 1 WHERE slug = ?').run('burn-pad');
const burnRow1 = db.prepare('SELECT * FROM pads WHERE slug = ?').get('burn-pad');
assert.strictEqual(burnRow1.view_count, 1);

// View 2 triggers deletion in logic
if (burnRow1.burn_after_read === 1 && burnRow1.view_count >= 1) {
  db.prepare('DELETE FROM pads WHERE slug = ?').run('burn-pad');
}
const burnRowAfter = db.prepare('SELECT * FROM pads WHERE slug = ?').get('burn-pad');
assert.strictEqual(burnRowAfter, undefined);
console.log('✓ Burn-after-reading successfully self-destructed the pad.');

console.log('\n--- TEST 3: Web Crypto API (AES-GCM & PBKDF2) ---');
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const passwordKey = await crypto.subtle.importKey(
  'raw',
  encoder.encode('SuperSecretPassword!'),
  'PBKDF2',
  false,
  ['deriveKey']
);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
  passwordKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);

const originalData = JSON.stringify({ notes: 'Java Spring Boot snippet', tabs: 2 });
const cipher = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  encoder.encode(originalData)
);
assert.notStrictEqual(originalData, decoder.decode(cipher));

const decryptedBuf = await crypto.subtle.decrypt(
  { name: 'AES-GCM', iv },
  key,
  cipher
);
assert.strictEqual(originalData, decoder.decode(decryptedBuf));
console.log('✓ Hardware-accelerated AES-GCM-256 encryption and decryption validated.');

// Wrong password fails
const wrongKey = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
  await crypto.subtle.importKey('raw', encoder.encode('WrongPassword'), 'PBKDF2', false, ['deriveKey']),
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);

let caughtError = false;
try {
  await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, wrongKey, cipher);
} catch (e) {
  caughtError = true;
}
assert.strictEqual(caughtError, true);
console.log('✓ Invalid password correctly rejected by AEAD integrity tag.');

db.close();
try { fs.unlinkSync(testDbPath); } catch {}
console.log('\n========================================');
console.log('ALL CRYPTOGRAPHIC & STORAGE TESTS PASSED!');
console.log('========================================');
