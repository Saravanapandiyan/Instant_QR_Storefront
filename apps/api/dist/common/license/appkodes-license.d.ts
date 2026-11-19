import type { Request, Response, NextFunction } from 'express';
export interface LicenseVerificationResult {
    valid: boolean;
    type?: string;
    product?: string;
    expiresAt?: string | null;
    message?: string;
    verifiedAt?: number;
    offlineSince?: number | null;
    graceMode?: boolean;
}
export interface LicenseGuardOptions {
    licenseKey?: string;
    domain?: string;
    productId?: string;
    version?: string;
    storeApiUrl?: string;
    recheckInterval?: number;
    gracePeriod?: number;
    onInvalid?: (result: LicenseVerificationResult) => void;
}
export declare function createLicenseGuard(options?: LicenseGuardOptions): {
    verify: () => Promise<LicenseVerificationResult>;
    middleware: () => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    startPeriodicCheck: () => void;
};
