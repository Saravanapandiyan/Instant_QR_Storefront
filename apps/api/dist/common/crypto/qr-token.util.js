"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptQrToken = encryptQrToken;
exports.decryptQrToken = decryptQrToken;
exports.signStorefrontSession = signStorefrontSession;
exports.verifyStorefrontSession = verifyStorefrontSession;
const crypto = __importStar(require("crypto"));
function getAesKey() {
    const secret = process.env.QR_TOKEN_SECRET ||
        process.env.JWT_SECRET ||
        'instadine-qr-encryption-secret-2026';
    return crypto.createHash('sha256').update(secret).digest();
}
function encryptQrToken(branchSlug, tableNumber) {
    const key = getAesKey();
    const payload = { s: branchSlug };
    if (tableNumber !== undefined && tableNumber !== null && String(tableNumber).trim() !== '') {
        payload.t = String(tableNumber).trim();
    }
    const plaintext = JSON.stringify(payload);
    const iv = crypto.createHmac('sha256', key).update(plaintext).digest().subarray(0, 12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64url');
}
function decryptQrToken(token) {
    try {
        const raw = Buffer.from(token, 'base64url');
        if (raw.length < 29)
            return null;
        const iv = raw.subarray(0, 12);
        const authTag = raw.subarray(12, 28);
        const ciphertext = raw.subarray(28);
        const key = getAesKey();
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
        const parsed = JSON.parse(decrypted);
        if (!parsed || typeof parsed.s !== 'string' || !parsed.s.trim()) {
            return null;
        }
        return parsed;
    }
    catch {
        return null;
    }
}
function signStorefrontSession(branchSlug, tableNumber, ttlMs = 4 * 60 * 60 * 1000) {
    const key = getAesKey();
    const payload = {
        s: branchSlug,
        ...(tableNumber ? { t: tableNumber } : {}),
        exp: Date.now() + ttlMs,
    };
    const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const sig = crypto.createHmac('sha256', key).update(data).digest('base64url');
    return `${data}.${sig}`;
}
function verifyStorefrontSession(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 2)
            return null;
        const [data, sig] = parts;
        const key = getAesKey();
        const expectedSig = crypto.createHmac('sha256', key).update(data).digest('base64url');
        const sigBuf = Buffer.from(sig);
        const expectedBuf = Buffer.from(expectedSig);
        if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
            return null;
        }
        const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
        if (!payload?.s || typeof payload.exp !== 'number' || Date.now() > payload.exp) {
            return null;
        }
        return payload;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=qr-token.util.js.map