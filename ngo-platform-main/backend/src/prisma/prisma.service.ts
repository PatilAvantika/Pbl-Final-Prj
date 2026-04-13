import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

/** `channel_binding=require` breaks many Node `pg` setups; Neon works with sslmode only. */
function normalizePostgresUrl(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete('channel_binding');
    let out = u.toString();
    if (out.endsWith('?')) {
      out = out.slice(0, -1);
    }
    return out;
  } catch {
    return url;
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor() {
    let connectionString = process.env.DATABASE_URL;

    // Handle Prisma Dev URLs
    if (connectionString && connectionString.startsWith('prisma+postgres://')) {
      const urlObj = new URL(connectionString);
      const apiKey = urlObj.searchParams.get('api_key');
      if (apiKey) {
        const decoded = Buffer.from(apiKey, 'base64').toString('utf-8');
        try {
          const parsed = JSON.parse(decoded);
          if (parsed.databaseUrl) {
            connectionString = parsed.databaseUrl;
          }
        } catch (e) { }
      }
    }

    if (connectionString?.startsWith('postgresql://') || connectionString?.startsWith('postgres://')) {
      connectionString = normalizePostgresUrl(connectionString);
    }

    // Neon (and other serverless Postgres) cold starts often exceed 20s; short timeouts surface as
    // "Connection terminated due to connection timeout" mid-request.
    const connectionTimeoutMillis = Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS) || 90_000;
    const poolMax = Number(process.env.DATABASE_POOL_MAX) || 10;

    const pool = new Pool({
      connectionString,
      connectionTimeoutMillis,
      max: poolMax,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
