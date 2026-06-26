// Client-side AES-GCM encryption for astrology chat messages.
// Plaintext never lives on the server in stored form - only ciphertext + iv land in the DB.

const enc = new TextEncoder();
const dec = new TextDecoder();

// Strict TS lib treats Uint8Array<ArrayBufferLike> as not assignable to BufferSource;
// every WebCrypto byte arg gets explicitly cast through this helper.
const buf = (b: Uint8Array): ArrayBuffer => {
  const out = new ArrayBuffer(b.byteLength);
  new Uint8Array(out).set(b);
  return out;
};

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const SECRET_KEY = "pranam.chat.secret.v1";

export function getOrCreateUserSecret(userId: string): string {
  const k = `${SECRET_KEY}:${userId}`;
  let s = localStorage.getItem(k);
  if (!s) {
    const r = new Uint8Array(32);
    crypto.getRandomValues(r);
    s = bytesToB64(r);
    localStorage.setItem(k, s);
  }
  return s;
}

export function generateSalt(): string {
  const r = new Uint8Array(16);
  crypto.getRandomValues(r);
  return bytesToB64(r);
}

export async function deriveSessionKey(userSecret: string, saltB64: string): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    buf(enc.encode(userSecret)),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: buf(b64ToBytes(saltB64)), iterations: 120000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptText(key: CryptoKey, text: string): Promise<{ ciphertext: string; iv: string }> {
  const ivBytes = new Uint8Array(12);
  crypto.getRandomValues(ivBytes);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: buf(ivBytes) },
    key,
    buf(enc.encode(text)),
  );
  return { ciphertext: bytesToB64(new Uint8Array(ct)), iv: bytesToB64(ivBytes) };
}

export async function decryptText(key: CryptoKey, ciphertext: string, iv: string): Promise<string> {
  try {
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: buf(b64ToBytes(iv)) },
      key,
      buf(b64ToBytes(ciphertext)),
    );
    return dec.decode(pt);
  } catch {
    return "🔒 [encrypted - unavailable on this device]";
  }
}
