import { Inject, Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

const KEY_PREFIX = 'volunteer:dashboard:v1';

@Injectable()
export class VolunteerCacheService implements OnModuleDestroy {
  private readonly log = new Logger(VolunteerCacheService.name);

  constructor(@Optional() @Inject(REDIS_CLIENT) private readonly redis: Redis | null) {
    if (!redis) {
      this.log.log('Redis not configured — volunteer dashboard cache disabled');
    }
  }

  async onModuleDestroy(): Promise<void> {
    // Shared REDIS_CLIENT lifecycle is app-wide; do not quit here.
  }

  cacheKey(userId: string, organizationId: string, timeZone: string): string {
    const tz = encodeURIComponent(timeZone);
    return `${KEY_PREFIX}:${userId}:${organizationId}:${tz}`;
  }

  async getJson(userId: string, organizationId: string, timeZone: string): Promise<unknown | null> {
    if (!this.redis) return null;
    try {
      const raw = await this.redis.get(this.cacheKey(userId, organizationId, timeZone));
      return raw ? (JSON.parse(raw) as unknown) : null;
    } catch (e) {
      this.log.warn(`get: ${e instanceof Error ? e.message : e}`);
      return null;
    }
  }

  async setJson(
    userId: string,
    organizationId: string,
    timeZone: string,
    payload: unknown,
    ttlSec: number,
  ): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.setex(this.cacheKey(userId, organizationId, timeZone), ttlSec, JSON.stringify(payload));
    } catch (e) {
      this.log.warn(`set: ${e instanceof Error ? e.message : e}`);
    }
  }

  /** Invalidate all cached dashboard entries for a user (any org / timezone variant). */
  async invalidateForUser(userId: string): Promise<void> {
    if (!this.redis) return;
    const pattern = `${KEY_PREFIX}:${userId}:*`;
    let cursor = '0';
    try {
      do {
        const [next, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 64);
        cursor = next;
        if (keys.length) await this.redis.del(...keys);
      } while (cursor !== '0');
    } catch (e) {
      this.log.warn(`invalidate: ${e instanceof Error ? e.message : e}`);
    }
  }
}
