import * as crypto from 'crypto';

function getAesKey(): Buffer {
  const secret =
    process.env.QR_TOKEN_SECRET ||
    process.env.JWT_SECRET ||
    'instadine-qr-encryption-secret-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

export interface QrTokenPayload {
  s: string; // branchSlug
  t?: string; // tableNumber
}

export interface StorefrontSessionPayload {
  s: string; // branchSlug
  t?: string; // locked tableNumber (if from QR)
  exp: number; // epoch ms
}

/**
 * Encrypts { s: branchSlug, t?: tableNumber } into a compact URL-safe AES-256-GCM token.
 * Uses a deterministic HMAC-derived IV from the plaintext so the same branch/table always
 * produces the same stable QR URL while preserving authenticated encryption.
 */
export function encryptQrToken(branchSlug: string, tableNumber?: string | number): string {
  const key = getAesKey();
  const payload: QrTokenPayload = { s: branchSlug };
  if (tableNumber !== undefined && tableNumber !== null && String(tableNumber).trim() !== '') {
    payload.t = String(tableNumber).trim();
  }
  const plaintext = JSON.stringify(payload);
  const iv = crypto.createHmac('sha256', key).update(plaintext).digest().subarray(0, 12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Pack iv (12B) + authTag (16B) + ciphertext into a single base64url string
  return Buffer.concat([iv, authTag, encrypted]).toString('base64url');
}

/**
 * Decrypts and authenticates an AES-256-GCM QR token. Returns null if invalid or tampered.
 */
export function decryptQrToken(token: string): QrTokenPayload | null {
  try {
    const raw = Buffer.from(token, 'base64url');
    if (raw.length < 29) return null; // 12B IV + 16B tag + >=1B data

    const iv = raw.subarray(0, 12);
    const authTag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);

    const key = getAesKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    const parsed = JSON.parse(decrypted) as QrTokenPayload;
    if (!parsed || typeof parsed.s !== 'string' || !parsed.s.trim()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Signs a short-lived guest storefront session token (HMAC-SHA256) used on POST /orders.
 */
export function signStorefrontSession(
  branchSlug: string,
  tableNumber?: string,
  ttlMs = 4 * 60 * 60 * 1000,
): string {
  const key = getAesKey();
  const payload: StorefrontSessionPayload = {
    s: branchSlug,
    ...(tableNumber ? { t: tableNumber } : {}),
    exp: Date.now() + ttlMs,
  };
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', key).update(data).digest('base64url');
  return `${data}.${sig}`;
}

/**
 * Verifies a storefront session token. Returns payload if valid & unexpired, else null.
 */
export function verifyStorefrontSession(token: string): StorefrontSessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data, sig] = parts;
    const key = getAesKey();
    const expectedSig = crypto.createHmac('sha256', key).update(data).digest('base64url');

    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as StorefrontSessionPayload;
    if (!payload?.s || typeof payload.exp !== 'number' || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
