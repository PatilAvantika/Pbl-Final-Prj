import { OnModuleDestroy } from '@nestjs/common';
import type Redis from 'ioredis';
export declare class VolunteerCacheService implements OnModuleDestroy {
    private readonly redis;
    private readonly log;
    constructor(redis: Redis | null);
    onModuleDestroy(): Promise<void>;
    cacheKey(userId: string, organizationId: string, timeZone: string): string;
    getJson(userId: string, organizationId: string, timeZone: string): Promise<unknown | null>;
    setJson(userId: string, organizationId: string, timeZone: string, payload: unknown, ttlSec: number): Promise<void>;
    invalidateForUser(userId: string): Promise<void>;
}
