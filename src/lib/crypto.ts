/**
 * Hardware-accelerated Web Crypto API Implementation for CodedPad
 * Standards: AES-GCM (256-bit), PBKDF2 (SHA-256, 100,000 iterations)
 */

export interface PadTab {
  id: string;
  title: string;
  language: string;
  content: string;
}

export interface DecryptedPadData {
  tabs: PadTab[];
  activeTabId?: string;
  isDecoyActive?: boolean;
}

export interface EncryptedSlot {
  salt: string; // Base64
  iv: string;   // Base64
  ciphertext: string; // Base64
}

export interface EncryptedPackage {
  format: 'codedpad-v2';
  slotA: EncryptedSlot;
  slotB?: EncryptedSlot; // Optional decoy slot for plausible deniability
}

// Helpers for buffer <-> base64 conversion
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// SHA-256 string hash helper
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Compute client-side zero-knowledge authorization proof
export async function computeAuthProof(password: string, slug: string): Promise<string> {
  return sha256(password + '::codedpad::' + slug.toLowerCase());
}

// PBKDF2 Key Derivation
async function deriveAesKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password) as unknown as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt single slot
async function encryptSlot(
  data: DecryptedPadData,
  password: string,
  slug: string
): Promise<EncryptedSlot> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt);

  const siteHash = await sha256('/' + slug.toLowerCase());
  const payload = JSON.stringify({
    tabs: data.tabs,
    activeTabId: data.activeTabId,
    siteHash,
    createdAt: Date.now(),
  });

  const encoder = new TextEncoder();
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    encoder.encode(payload) as unknown as BufferSource
  );

  return {
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertextBuffer),
  };
}

// Attempt decrypt single slot
async function decryptSlot(
  slot: EncryptedSlot,
  password: string,
  slug: string
): Promise<DecryptedPadData | null> {
  try {
    const salt = base64ToBuffer(slot.salt);
    const iv = base64ToBuffer(slot.iv);
    const ciphertext = base64ToBuffer(slot.ciphertext);

    const key = await deriveAesKey(password, salt);
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
      },
      key,
      ciphertext as unknown as BufferSource
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    const parsed = JSON.parse(jsonString);

    const expectedSiteHash = await sha256('/' + slug.toLowerCase());
    if (parsed.siteHash !== expectedSiteHash) {
      console.warn('Site hash mismatch: pad origin binding check failed.');
      return null;
    }

    return {
      tabs: parsed.tabs || [],
      activeTabId: parsed.activeTabId,
    };
  } catch {
    // Decryption failure (incorrect password or corrupted tag)
    return null;
  }
}

/**
 * Encrypt Pad Package with optional Decoy Slot
 */
export async function encryptPad({
  data,
  primaryPassword,
  decoyPassword,
  decoyData,
  slug,
}: {
  data: DecryptedPadData;
  primaryPassword: string;
  decoyPassword?: string;
  decoyData?: DecryptedPadData;
  slug: string;
}): Promise<string> {
  const slotA = await encryptSlot(data, primaryPassword, slug);

  let slotB: EncryptedSlot | undefined = undefined;
  if (decoyPassword && decoyData) {
    slotB = await encryptSlot(decoyData, decoyPassword, slug);
  }

  const pkg: EncryptedPackage = {
    format: 'codedpad-v2',
    slotA,
    slotB,
  };

  return JSON.stringify(pkg);
}

/**
 * Decrypt Pad Package. Checks slotA first, then slotB for plausible deniability.
 */
export async function decryptPad(
  rawEncryptedJson: string,
  password: string,
  slug: string
): Promise<{ success: boolean; data?: DecryptedPadData; isDecoy?: boolean }> {
  try {
    const pkg: EncryptedPackage = JSON.parse(rawEncryptedJson);
    if (!pkg.slotA) {
      return { success: false };
    }

    // Try primary slot first
    const primaryResult = await decryptSlot(pkg.slotA, password, slug);
    if (primaryResult) {
      return { success: true, data: primaryResult, isDecoy: false };
    }

    // Try decoy slot if available
    if (pkg.slotB) {
      const decoyResult = await decryptSlot(pkg.slotB, password, slug);
      if (decoyResult) {
        return { success: true, data: decoyResult, isDecoy: true };
      }
    }

    return { success: false };
  } catch (err) {
    console.error('Decryption parse error:', err);
    return { success: false };
  }
}
