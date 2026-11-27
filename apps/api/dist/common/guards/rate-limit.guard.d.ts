import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare const RATE_LIMIT_KEY = "rate_limit_options";
export interface RateLimitOptions {
    limit: number;
    windowMs: number;
}
export declare const RateLimit: (options: RateLimitOptions) => import("@nestjs/common", { with: { "resolution-mode": "import" } }).CustomDecorator<string>;
export declare class RateLimitGuard implements CanActivate {
    private readonly reflector;
    private readonly buckets;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
