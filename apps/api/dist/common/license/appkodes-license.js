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
exports.createLicenseGuard = createLicenseGuard;
const crypto = __importStar(require("crypto"));
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const os = __importStar(require("os"));
function deriveHmacKey(licenseKey) {
    const machineId = [
        process.platform,
        process.arch,
        os.hostname(),
        __dirname,
    ].join('|');
    return crypto.createHash('sha256').update(`${licenseKey}:${machineId}`).digest();
}
function signPayload(payload, hmacKey) {
    const json = JSON.stringify(payload);
    const sig = crypto.createHmac('sha256', hmacKey).update(json).digest('hex');
    return { data: json, sig };
}
function verifyPayload(signed, hmacKey) {
    if (!signed || !signed.data || !signed.sig)
        return null;
    const expected = crypto.createHmac('sha256', hmacKey).update(signed.data).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signed.sig, 'hex'), Buffer.from(expected, 'hex'))) {
        return null;
    }
    try {
        return JSON.parse(signed.data);
    }
    catch {
        return null;
    }
}
function postJson(url, body) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const transport = parsed.protocol === 'https:' ? https : http;
        const data = JSON.stringify(body);
        const req = transport.request({
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            path: parsed.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
            },
            timeout: 10000,
        }, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => (responseBody += chunk));
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
                }
                catch {
                    reject(new Error(`Invalid JSON response: ${responseBody.slice(0, 200)}`));
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });
        req.write(data);
        req.end();
    });
}
function createLicenseGuard(options = {}) {
    const { licenseKey = process.env.LICENSE_KEY || '', domain = process.env.APP_DOMAIN || '', productId = 'instant-qr-storefront', version = '1.0.0', storeApiUrl = process.env.STORE_API_URL || 'https://store.appkodes.com', recheckInterval = 24 * 60 * 60 * 1000, gracePeriod = 3 * 24 * 60 * 60 * 1000, onInvalid, } = options;
    const isDemoOrDev = process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';
    const isDevBypass = !licenseKey && isDemoOrDev;
    const hmacKey = licenseKey ? deriveHmacKey(licenseKey) : Buffer.from('');
    const verifyUrl = `${storeApiUrl.replace(/\/$/, '')}/api/store/licence/verify`;
    let cache = null;
    let verifyTimer = null;
    function fallbackOrDeny(message) {
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
    async function verify() {
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
        const body = {
            licenseKey,
            domain,
            productId,
            version,
        };
        let res;
        try {
            res = await postJson(verifyUrl, body);
        }
        catch (err) {
            return fallbackOrDeny(`Unable to verify license: ${err.message}`);
        }
        if (res.status === 200 && res.data && typeof res.data.valid === 'boolean') {
            const result = {
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
        if (isDevBypass)
            return;
        if (verifyTimer)
            clearInterval(verifyTimer);
        verifyTimer = setInterval(async () => {
            const result = await verify();
            if (!result.valid && typeof onInvalid === 'function') {
                onInvalid(result);
            }
        }, recheckInterval);
        if (verifyTimer.unref)
            verifyTimer.unref();
    }
    function middleware() {
        let initialCheckDone = false;
        let initialCheckPromise = null;
        return async (req, res, next) => {
            if (req.path === '/' ||
                req.path === '/api/v1' ||
                req.path === '/health' ||
                req.path === '/api/health' ||
                req.path === '/api/v1/health' ||
                req.path.startsWith('/api/docs') ||
                req.path.startsWith('/uploads')) {
                return next();
            }
            if (isDevBypass) {
                return next();
            }
            if (!initialCheckDone) {
                if (!initialCheckPromise) {
                    initialCheckPromise = verify().then((result) => {
                        initialCheckDone = true;
                        if (result.valid)
                            startPeriodicCheck();
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
//# sourceMappingURL=appkodes-license.js.map