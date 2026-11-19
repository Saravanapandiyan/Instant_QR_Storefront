import * as crypto from 'crypto';
import * as http from 'http';
import * as https from 'https';
import * as os from 'os';
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
  recheckInterval?: number; // default: 24h
  gracePeriod?: number;     // default: 3 days
  onInvalid?: (result: LicenseVerificationResult) => void;
}

function deriveHmacKey(licenseKey: string): Buffer {
  const machineId = [
    process.platform,
    process.arch,
    os.hostname(),
    __dirname,
  ].join('|');
  return crypto.createHash('sha256').update(`${licenseKey}:${machineId}`).digest();
}

function signPayload(payload: any, hmacKey: Buffer): { data: string; sig: string } {
  const json = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', hmacKey).update(json).digest('hex');
  return { data: json, sig };
}

function verifyPayload(signed: { data: string; sig: string } | null, hmacKey: Buffer): any {
  if (!signed || !signed.data || !signed.sig) return null;
  const expected = crypto.createHmac('sha256', hmacKey).update(signed.data).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(signed.sig, 'hex'), Buffer.from(expected, 'hex'))) {
    return null;
  }
  try {
    return JSON.parse(signed.data);
  } catch {
    return null;
  }
}

function postJson(url: string, body: Record<string, any>): Promise<{ status?: number; data?: any }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;
    const data = JSON.stringify(body);

    const req = transport.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 10000,
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
          } catch {
            reject(new Error(`Invalid JSON response: ${responseBody.slice(0, 200)}`));
          }
        });
      },
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.write(data);
    req.end();
  });
}

export function createLicenseGuard(options: LicenseGuardOptions = {}) {
  const {
    licenseKey = process.env.LICENSE_KEY || '',
    domain = process.env.APP_DOMAIN || '',
    productId = 'instant-qr-storefront',
    version = '1.0.0',
    storeApiUrl = process.env.STORE_API_URL || 'https://store.appkodes.com',
    recheckInterval = 24 * 60 * 60 * 1000, // 24 hours
    gracePeriod = 3 * 24 * 60 * 60 * 1000,  // 3 days offline grace
    onInvalid,
  } = options;

  // In development or demo mode, if no license is configured, allow pass-through
  const isDemoOrDev = process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';
  const isDevBypass = !licenseKey && isDemoOrDev;

  const hmacKey = licenseKey ? deriveHmacKey(licenseKey) : Buffer.from('');
  const verifyUrl = `${storeApiUrl.replace(/\/$/, '')}/api/store/licence/verify`;

  let cache: { data: string; sig: string } | null = null;
  let verifyTimer: NodeJS.Timeout | null = null;

  function fallbackOrDeny(message: string): LicenseVerificationResult {
    const cached = cache ? verifyPayload(cache, hmacKey) : null;

    if (cached && cached.valid) {
      const offlineStart = cached.offlineSince || Date.now();
      if (Date.now() - offlineStart < gracePeriod) {
        const updated = { ...cached, offlineSince: offlineStart };
        cache = signPayload(updated, hmacKey);
        return { ...updated, graceMode: true };
      }
    }

    return { valid: false, message };
  }

  async function verify(): Promise<LicenseVerificationResult> {
    if (isDevBypass) {
      return {
        valid: true,
        type: process.env.DEMO_MODE === 'true' ? 'Demo Mode (DEMO_MODE=true)' : 'Development Bypass',
        product: productId,
      };
    }

    if (!licenseKey || !domain) {
      return {
        valid: false,
        message: 'AppKodes License: LICENSE_KEY and APP_DOMAIN are required.',
      };
    }

    const body: Record<string, any> = {
      licenseKey,
      domain,
      productId,
      version,
    };

    let res;
    try {
      res = await postJson(verifyUrl, body);
    } catch (err: any) {
      return fallbackOrDeny(`Unable to verify license: ${err.message}`);
    }

    if (res.status === 200 && res.data && typeof res.data.valid === 'boolean') {
      const result: LicenseVerificationResult = {
        valid: res.data.valid === true,
        type: res.data.type,
        product: res.data.product,
        expiresAt: res.data.expiresAt,
        message: res.data.message,
        verifiedAt: Date.now(),
        offlineSince: null,
      };

      cache = signPayload(result, hmacKey);
      return result;
    }

    return fallbackOrDeny(res.data?.message || `Unexpected response (status ${res.status})`);
  }

  function startPeriodicCheck() {
    if (isDevBypass) return;
    if (verifyTimer) clearInterval(verifyTimer);
    verifyTimer = setInterval(async () => {
      const result = await verify();
      if (!result.valid && typeof onInvalid === 'function') {
        onInvalid(result);
      }
    }, recheckInterval);
    if (verifyTimer.unref) verifyTimer.unref();
  }

  function middleware() {
    let initialCheckDone = false;
    let initialCheckPromise: Promise<LicenseVerificationResult> | null = null;

    return async (req: Request, res: Response, next: NextFunction) => {
      if (
        req.path === '/' ||
        req.path === '/api/v1' ||
        req.path === '/health' ||
        req.path === '/api/health' ||
        req.path === '/api/v1/health' ||
        req.path.startsWith('/api/docs') ||
        req.path.startsWith('/uploads')
      ) {
        return next();
      }

      if (isDevBypass) {
        return next();
      }

      if (!initialCheckDone) {
        if (!initialCheckPromise) {
          initialCheckPromise = verify().then((result) => {
            initialCheckDone = true;
            if (result.valid) startPeriodicCheck();
            return result;
          });
        }
        const result = await initialCheckPromise;
        if (!result.valid) {
          return res.status(503).json({
            statusCode: 503,
            error: 'License verification failed',
            message: result.message,
          });
        }
      }

      const cached = cache ? verifyPayload(cache, hmacKey) : null;
      if (!cached || !cached.valid) {
        const result = await verify();
        if (!result.valid) {
          return res.status(503).json({
            statusCode: 503,
            error: 'License verification failed',
            message: result.message,
          });
        }
      }

      next();
    };
  }

  return { verify, middleware, startPeriodicCheck };
}
