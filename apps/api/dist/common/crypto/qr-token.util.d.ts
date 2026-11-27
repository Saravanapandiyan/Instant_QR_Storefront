export interface QrTokenPayload {
    s: string;
    t?: string;
}
export interface StorefrontSessionPayload {
    s: string;
    t?: string;
    exp: number;
}
export declare function encryptQrToken(branchSlug: string, tableNumber?: string | number): string;
export declare function decryptQrToken(token: string): QrTokenPayload | null;
export declare function signStorefrontSession(branchSlug: string, tableNumber?: string, ttlMs?: number): string;
export declare function verifyStorefrontSession(token: string): StorefrontSessionPayload | null;
