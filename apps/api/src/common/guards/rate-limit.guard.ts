import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const RATE_LIMIT_KEY = 'rate_limit_options';

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);

interface BucketEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, BucketEntry>();

  constructor(private readonly reflector: Reflector) {
    // Periodic cleanup every 5 minutes to prevent unbounded memory growth
    const timer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.buckets.entries()) {
        if (now > entry.resetAt) {
          this.buckets.delete(key);
        }
      }
    }, 5 * 60 * 1000);
    if (typeof timer.unref === 'function') timer.unref();
  }

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options) return true;

    const req = context.switchToHttp().getRequest();
    const forwardedFor = req.headers?.['x-forwarded-for'];
    const ip =
      (Array.isArray(forwardedFor)
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
      throw new HttpException(
        'Too many requests. Please wait a moment before trying again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    existing.count += 1;
    return true;
  }
}
