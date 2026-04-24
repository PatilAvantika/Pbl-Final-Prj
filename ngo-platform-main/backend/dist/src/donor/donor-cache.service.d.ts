import { OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export declare class DonorCacheService implements OnModuleDestroy {
    private readonly prisma;
    private readonly log;
    private client;
    constructor(prisma: PrismaService);
    private cacheKey;
    onModuleDestroy(): Promise<void>;
    getDashboardJson(organizationId: string, donorId: string): Promise<unknown | null>;
    setDashboardJson(organizationId: string, donorId: string, payload: unknown, ttlSec?: number): Promise<void>;
    invalidateDashboardForDonor(organizationId: string, donorId: string): Promise<void>;
    invalidateDashboardForCampaign(campaignId: string): Promise<void>;
    invalidateDashboardForReport(reportId: string): Promise<void>;
}
