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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var DonorCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonorCacheService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
const prisma_service_1 = require("../prisma/prisma.service");
const DEFAULT_TTL_SEC = 120;
let DonorCacheService = DonorCacheService_1 = class DonorCacheService {
    prisma;
    log = new common_1.Logger(DonorCacheService_1.name);
    client = null;
    constructor(prisma) {
        this.prisma = prisma;
        const url = process.env.REDIS_URL?.trim();
        if (!url) {
            this.log.log('REDIS_URL not set — donor dashboard cache disabled');
            return;
        }
        try {
            this.client = new ioredis_1.default(url, {
                maxRetriesPerRequest: 2,
                enableReadyCheck: true,
                lazyConnect: false,
            });
            this.client.on('error', (err) => this.log.warn(`Redis: ${err.message}`));
        }
        catch (e) {
            this.log.warn(`Redis init failed: ${e instanceof Error ? e.message : e}`);
            this.client = null;
        }
    }
    cacheKey(organizationId, donorId) {
        return `donor:dashboard:v3:${organizationId}:${donorId}`;
    }
    async onModuleDestroy() {
        if (this.client) {
            await this.client.quit().catch(() => undefined);
            this.client = null;
        }
    }
    async getDashboardJson(organizationId, donorId) {
        if (!this.client)
            return null;
        try {
            const raw = await this.client.get(this.cacheKey(organizationId, donorId));
            return raw ? JSON.parse(raw) : null;
        }
        catch {
            return null;
        }
    }
    async setDashboardJson(organizationId, donorId, payload, ttlSec = DEFAULT_TTL_SEC) {
        if (!this.client)
            return;
        try {
            await this.client.setex(this.cacheKey(organizationId, donorId), ttlSec, JSON.stringify(payload));
        }
        catch (e) {
            this.log.warn(`Redis set failed: ${e instanceof Error ? e.message : e}`);
        }
    }
    async invalidateDashboardForDonor(organizationId, donorId) {
        if (!this.client)
            return;
        try {
            await this.client.del(this.cacheKey(organizationId, donorId));
        }
        catch (e) {
            this.log.warn(`Redis del failed: ${e instanceof Error ? e.message : e}`);
        }
    }
    async invalidateDashboardForCampaign(campaignId) {
        if (!this.client)
            return;
        const rows = await this.prisma.donation.findMany({
            where: { campaignId },
            distinct: ['donorId'],
            select: {
                donorId: true,
                donor: { select: { organizationId: true } },
            },
        });
        await Promise.all(rows.map((r) => this.invalidateDashboardForDonor(r.donor.organizationId, r.donorId)));
    }
    async invalidateDashboardForReport(reportId) {
        if (!this.client)
            return;
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
        await Promise.all(rows.map((r) => this.invalidateDashboardForDonor(r.donor.organizationId, r.donorId)));
    }
};
exports.DonorCacheService = DonorCacheService;
exports.DonorCacheService = DonorCacheService = DonorCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DonorCacheService);
//# sourceMappingURL=donor-cache.service.js.map