// Client-side AES-GCM encryption for astrology chat messages.
// Plaintext never lives on the server in stored form — only ciphertext + iv land in the DB.
// The session key is derived in-browser via PBKDF2 from a stable per-user secret + the
// session salt issued at session creation. localStorage holds the user secret so the
// same browser can decrypt history across reloads.

const enc = new TextEncoder();
const dec = new TextDecoder();

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
    const buf = new Uint8Array(32);
    crypto.getRandomValues(buf);
    s = bytesToB64(buf);
    localStorage.setItem(k, s);
  }
  return s;
}

export function generateSalt(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return bytesToB64(buf);
}

export async function deriveSessionKey(userSecret: string, saltB64: string): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(userSecret),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: b64ToBytes(saltB64), iterations: 120000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptText(key: CryptoKey, text: string): Promise<{ ciphertext: string; iv: string }> {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
  return { ciphertext: bytesToB64(new Uint8Array(ct)), iv: bytesToB64(iv) };
}

export async function decryptText(key: CryptoKey, ciphertext: string, iv: string): Promise<string> {
  try {
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBytes(iv) },
      key,
      b64ToBytes(ciphertext),
    );
    return dec.decode(pt);
  } catch {
    return "🔒 [encrypted — unavailable on this device]";
  }
}
