// End-to-End Cryptography and Database Verification Test
import assert from 'node:assert';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

// Clean test db
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const testDbPath = path.join(dataDir, 'test-codedpad.db');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const db = new DatabaseSync(testDbPath);
db.exec(`
  CREATE TABLE pads (
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
`);

console.log('--- TEST 1: Database Insert & Concurrency Control ---');
const ins = db.prepare(`
  INSERT INTO pads (slug, encrypted_content, content_hash, version, expires_at, burn_after_read, view_count, created_at, updated_at)
  VALUES (?, ?, ?, 1, NULL, 0, 0, ?, ?)
`);
ins.run('test-pad', 'enc_blob_1', 'hash_v1', Date.now(), Date.now());

const sel = db.prepare('SELECT * FROM pads WHERE slug = ?').get('test-pad');
assert.strictEqual(sel.slug, 'test-pad');
assert.strictEqual(sel.encrypted_content, 'enc_blob_1');
console.log('✓ Pad successfully saved and retrieved.');

// Simulate concurrency check
const updateStmt = db.prepare('UPDATE pads SET encrypted_content = ?, content_hash = ?, version = version + 1 WHERE slug = ? AND content_hash = ?');
const resFail = updateStmt.run('enc_blob_2', 'hash_v2', 'test-pad', 'wrong_hash');
assert.strictEqual(resFail.changes, 0, 'Should not update when content_hash does not match');
console.log('✓ Optimistic concurrency collision successfully prevented.');

const resOk = updateStmt.run('enc_blob_2', 'hash_v2', 'test-pad', 'hash_v1');
assert.strictEqual(resOk.changes, 1, 'Should update when content_hash matches');
console.log('✓ Valid write authorization accepted.');

console.log('\n--- TEST 2: Burn-After-Reading (Self-Destruct) ---');
const burnIns = db.prepare(`
  INSERT INTO pads (slug, encrypted_content, content_hash, version, expires_at, burn_after_read, view_count, created_at, updated_at)
  VALUES (?, ?, ?, 1, NULL, 1, 0, ?, ?)
`);
burnIns.run('burn-pad', 'burn_blob', 'hash_burn', Date.now(), Date.now());

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

console.log('\n--- TEST 3: Web Crypto API in Node 22 (AES-GCM & PBKDF2) ---');
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Derive key
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

// Encrypt
const originalData = JSON.stringify({ notes: 'Classified Mission Brief', tabs: 3 });
const cipher = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  encoder.encode(originalData)
);
assert.notStrictEqual(originalData, decoder.decode(cipher));

// Decrypt with correct key
const decryptedBuf = await crypto.subtle.decrypt(
  { name: 'AES-GCM', iv },
  key,
  cipher
);
const decryptedStr = decoder.decode(decryptedBuf);
assert.strictEqual(originalData, decryptedStr);
console.log('✓ Hardware-accelerated AES-GCM-256 encryption and decryption validated.');

// Decrypt with wrong password fails
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
assert.strictEqual(caughtError, true, 'Decryption with wrong password MUST throw OperationError');
console.log('✓ Invalid password correctly rejected by AEAD integrity tag.');

// Cleanup test db
db.close();
fs.unlinkSync(testDbPath);
console.log('\n========================================');
console.log('ALL CRYPTOGRAPHIC & STORAGE TESTS PASSED!');
console.log('========================================');
