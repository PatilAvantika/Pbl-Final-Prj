import { Global, Logger, Module } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

/**
 * Optional shared Redis handle for modules that need raw ioredis (OTP, queues).
 * Donor dashboard cache keeps its own client until a follow-up consolidation.
 */
@Global()
@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            useFactory: () => {
                const url = process.env.REDIS_URL?.trim();
                if (!url) return null;
                try {
                    const client = new Redis(url, { maxRetriesPerRequest: null });
                    const log = new Logger('RedisModule');
                    client.on('error', (err) => log.warn(err.message));
                    return client;
                } catch {
                    return null;
                }
            },
        },
    ],
    exports: [REDIS_CLIENT],
})
export class RedisModule {}
