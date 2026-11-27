"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = exports.RateLimit = exports.RATE_LIMIT_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
exports.RATE_LIMIT_KEY = 'rate_limit_options';
const RateLimit = (options) => (0, common_1.SetMetadata)(exports.RATE_LIMIT_KEY, options);
exports.RateLimit = RateLimit;
let RateLimitGuard = class RateLimitGuard {
    reflector;
    buckets = new Map();
    constructor(reflector) {
        this.reflector = reflector;
        const timer = setInterval(() => {
            const now = Date.now();
            for (const [key, entry] of this.buckets.entries()) {
                if (now > entry.resetAt) {
                    this.buckets.delete(key);
                }
            }
        }, 5 * 60 * 1000);
        if (typeof timer.unref === 'function')
            timer.unref();
    }
    canActivate(context) {
        const options = this.reflector.getAllAndOverride(exports.RATE_LIMIT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!options)
            return true;
        const req = context.switchToHttp().getRequest();
        const forwardedFor = req.headers?.['x-forwarded-for'];
        const ip = (Array.isArray(forwardedFor)
            ? forwardedFor[0]
            : typeof forwardedFor === 'string'
                ? forwardedFor.split(',')[0].trim()
                : req.ip) || 'unknown';
        const routeKey = `${ip}:${req.method}:${req.route?.path || req.url}`;
        const now = Date.now();
        const existing = this.buckets.get(routeKey);
        if (!existing || now > existing.resetAt) {
            this.buckets.set(routeKey, { count: 1, resetAt: now + options.windowMs });
            return true;
        }
        if (existing.count >= options.limit) {
            throw new common_1.HttpException('Too many requests. Please wait a moment before trying again.', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        existing.count += 1;
        return true;
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map