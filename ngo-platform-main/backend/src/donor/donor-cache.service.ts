import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_TTL_SEC = 120;

/**
 * Optional Redis cache for donor dashboard (tenant + donor scoped).
 * Invalidation: donation created, report approved (linked), campaign updated.
 */
@Injectable()
export class DonorCacheService implements OnModuleDestroy {
    private readonly log = new Logger(DonorCacheService.name);
    private client: Redis | null = null;

    constructor(private readonly prisma: PrismaService) {
        const url = process.env.REDIS_URL?.trim();
        if (!url) {
            this.log.log('REDIS_URL not set — donor dashboard cache disabled');
            return;
        }
        try {
            this.client = new Redis(url, {
                maxRetriesPerRequest: 2,
                enableReadyCheck: true,
                lazyConnect: false,
            });
            this.client.on('error', (err) => this.log.warn(`Redis: ${err.message}`));
        } catch (e) {
            this.log.warn(`Redis init failed: ${e instanceof Error ? e.message : e}`);
            this.client = null;
        }
    }

    private cacheKey(organizationId: string, donorId: string): string {
        return `donor:dashboard:v3:${organizationId}:${donorId}`;
    }

    async onModuleDestroy(): Promise<void> {
        if (this.client) {
            await this.client.quit().catch(() => undefined);
            this.client = null;
        }
    }

    async getDashboardJson(organizationId: string, donorId: string): Promise<unknown | null> {
        if (!this.client) return null;
        try {
            const raw = await this.client.get(this.cacheKey(organizationId, donorId));
            return raw ? (JSON.parse(raw) as unknown) : null;
        } catch {
            return null;
        }
    }

    async setDashboardJson(
        organizationId: string,
        donorId: string,
        payload: unknown,
        ttlSec = DEFAULT_TTL_SEC,
    ): Promise<void> {
        if (!this.client) return;
        try {
            await this.client.setex(
                this.cacheKey(organizationId, donorId),
                ttlSec,
                JSON.stringify(payload),
            );
        } catch (e) {
            this.log.warn(`Redis set failed: ${e instanceof Error ? e.message : e}`);
        }
    }

    async invalidateDashboardForDonor(organizationId: string, donorId: string): Promise<void> {
        if (!this.client) return;
        try {
            await this.client.del(this.cacheKey(organizationId, donorId));
        } catch (e) {
            this.log.warn(`Redis del failed: ${e instanceof Error ? e.message : e}`);
        }
    }

    /** All donors who donated to this campaign (per-tenant keys). */
    async invalidateDashboardForCampaign(campaignId: string): Promise<void> {
        if (!this.client) return;
        const rows = await this.prisma.donation.findMany({
            where: { campaignId },
            distinct: ['donorId'],
            select: {
                donorId: true,
                donor: { select: { organizationId: true } },
            },
        });
        await Promise.all(
            rows.map((r) => this.invalidateDashboardForDonor(r.donor.organizationId, r.donorId)),
        );
    }

    /** Donors who could see this report via CampaignReport → funded campaign. */
    async invalidateDashboardForReport(reportId: string): Promise<void> {
        if (!this.client) return;
        const rows = await this.prisma.donation.findMany({
            where: {
                campaign: {
                    campaignReports: { some: { reportId } },
                },
            },
            distinct: ['donorId'],
            select: {
                donorId: true,
                donor: { select: { organizationId: true } },
            },
        });
        await Promise.all(
            rows.map((r) => this.invalidateDashboardForDonor(r.donor.organizationId, r.donorId)),
        );
    }
}
