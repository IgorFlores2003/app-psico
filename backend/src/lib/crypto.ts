import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (!envKey) {
    throw new Error('FATAL: ENCRYPTION_KEY is not defined in environment variables.');
  }

  if (/^[0-9a-fA-F]{64}$/.test(envKey)) {
    return Buffer.from(envKey, 'hex');
  }

  if (envKey.length === 44) {
    return Buffer.from(envKey, 'base64');
  }

  return crypto.createHash('sha256').update(envKey).digest();
}

export function encrypt(plaintext: string | null | undefined): string {
  if (!plaintext) return '';

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(cipherCombined: string | null | undefined): string {
  if (!cipherCombined) return '';

  const parts = cipherCombined.split(':');
  if (parts.length !== 3) {
    return cipherCombined;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('Decryption error: Failed to decrypt clinical data or integrity check failed.');
    return '[DADO RESTRITO - ERRO DE INTEGRIDADE NA DECRIPTAÇÃO]';
  }
}

export function encryptJSON(data: unknown): string {
  return encrypt(JSON.stringify(data));
}

export function decryptJSON<T = unknown>(cipherCombined: string | null | undefined): T | null {
  const decrypted = decrypt(cipherCombined);
  if (!decrypted || decrypted.startsWith('[DADO RESTRITO')) return null;
  try {
    return JSON.parse(decrypted) as T;
  } catch {
    return null;
  }
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
