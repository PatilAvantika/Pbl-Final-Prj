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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonorService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const pdfkit_1 = __importDefault(require("pdfkit"));
const donor_repository_1 = require("./donor.repository");
const donor_cache_service_1 = require("./donor-cache.service");
function monthKeyUtc(d) {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
function buildHeatmapBuckets(rows, precision = 2) {
    const mult = 10 ** precision;
    const map = new Map();
    for (const r of rows) {
        const bLat = Math.round(r.task.geofenceLat * mult) / mult;
        const bLng = Math.round(r.task.geofenceLng * mult) / mult;
        const key = `${bLat},${bLng}`;
        const cur = map.get(key) ?? {
            bucketLat: bLat,
            bucketLng: bLng,
            reportCount: 0,
            label: `${bLat.toFixed(precision)}°, ${bLng.toFixed(precision)}°`,
        };
        cur.reportCount += 1;
        map.set(key, cur);
    }
    const arr = [...map.values()];
    const max = Math.max(1, ...arr.map((x) => x.reportCount));
    return arr.map((x) => ({ ...x, density: Math.round((x.reportCount / max) * 1000) / 1000 }));
}
let DonorService = class DonorService {
    repo;
    cache;
    constructor(repo, cache) {
        this.repo = repo;
        this.cache = cache;
    }
    assertDateRange(q) {
        if (q.from && q.to) {
            const a = new Date(q.from);
            const b = new Date(q.to);
            if (!Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime()) && a.getTime() > b.getTime()) {
                throw new common_1.BadRequestException('Invalid date range: "from" must be before or equal to "to" (ISO dates interpreted as UTC).');
            }
        }
    }
    clampLimit(limit) {
        const l = limit ?? 20;
        return Math.min(Math.max(1, l), 100);
    }
    async getDashboard(donorId, organizationId) {
        const cached = await this.cache.getDashboardJson(organizationId, donorId);
        if (cached)
            return cached;
        const campaignIds = await this.repo.findFundedCampaignIds(donorId, organizationId);
        const donations = await this.repo.findDonationsForDonor(donorId, organizationId);
        const taskIds = await this.repo.findTaskIdsForFundedCampaigns(campaignIds, organizationId);
        const totalDonations = donations.reduce((s, d) => s + d.amount, 0);
        const campaignsSupported = new Set(campaignIds).size;
        const wasteCollected = await this.repo.sumWasteDistinctLinkedReports(campaignIds, organizationId);
        const clockIns = await this.repo.countClockInsForTasks(taskIds, organizationId);
        const volunteerHoursSupported = Math.round((clockIns * 3.5 * 10) / 10);
        const trendMap = new Map();
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
            trendMap.set(monthKeyUtc(d), 0);
        }
        for (const d of donations) {
            const k = monthKeyUtc(new Date(d.createdAt));
            if (trendMap.has(k))
                trendMap.set(k, (trendMap.get(k) ?? 0) + d.amount);
        }
        const donationTrend = [...trendMap.entries()].map(([month, amount]) => ({ month, amount }));
        const tasksWithTemplate = taskIds.length > 0 ? await this.repo.findTaskTemplates(taskIds, organizationId) : [];
        const tplCount = new Map();
        for (const t of tasksWithTemplate) {
            tplCount.set(t.template, (tplCount.get(t.template) ?? 0) + 1);
        }
        const impactDistribution = [...tplCount.entries()].map(([name, value]) => ({
            name: name.replace(/_/g, ' '),
            value,
        }));
        const recentCampaigns = await this.repo.findRecentCampaignsForDonor(campaignIds, donorId, organizationId, 4);
        const totalLinked = await this.repo.countDistinctLinkedApprovedReports(campaignIds, organizationId);
        const recentReports = totalLinked > 0
            ? await this.repo.findLinkedApprovedReportsPage(campaignIds, organizationId, 0, 5)
            : [];
        const currency = donations[0]?.currency ?? 'INR';
        const payload = {
            summary: {
                totalDonations,
                campaignsSupported,
                totalImpact: wasteCollected,
                volunteerHours: volunteerHoursSupported,
                currency,
            },
            kpis: {
                totalDonations,
                campaignsSupported,
                wasteCollected,
                totalImpact: wasteCollected,
                volunteerHoursSupported,
                volunteerHours: volunteerHoursSupported,
                currency,
            },
            donationTrend,
            impactDistribution,
            recentCampaigns: recentCampaigns.map((c) => ({
                id: c.id,
                title: c.title,
                zoneName: c.zoneName,
                status: c.status,
                lat: c.lat,
                lng: c.lng,
                contributed: c.donations.reduce((s, x) => s + x.amount, 0),
                template: c.task?.template,
            })),
            recentReports: recentReports.map((r) => ({
                id: r.id,
                taskTitle: r.task.title,
                zoneName: r.task.zoneName,
                quantityItems: r.quantityItems,
                wasteCollected: r.quantityItems,
                timestamp: r.timestamp,
                beforePhotoUrl: r.beforePhotoUrl,
                afterPhotoUrl: r.afterPhotoUrl,
                volunteerName: `${r.user.firstName} ${r.user.lastName}`,
            })),
        };
        await this.cache.setDashboardJson(organizationId, donorId, payload);
        return payload;
    }
    async getCampaigns(donorId, organizationId, q) {
        this.assertDateRange(q);
        const campaignIds = await this.repo.findFundedCampaignIds(donorId, organizationId);
        if (!campaignIds.length) {
            return { data: [], total: 0, page: q.page ?? 1, limit: this.clampLimit(q.limit), hasNext: false };
        }
        const page = q.page ?? 1;
        const limit = this.clampLimit(q.limit);
        const skip = (page - 1) * limit;
        const total = await this.repo.countDonorCampaignsFiltered(campaignIds, donorId, organizationId, q);
        const list = await this.repo.findDonorCampaignsFilteredPage(campaignIds, donorId, organizationId, q, skip, limit);
        const rows = await Promise.all(list.map(async (c) => {
            const contributed = c.donations.reduce((s, d) => s + d.amount, 0);
            const impactMetrics = await this.repo.getCampaignVerifiedImpact(c.id, organizationId);
            return {
                id: c.id,
                title: c.title,
                description: c.description,
                zoneName: c.zoneName,
                lat: c.lat,
                lng: c.lng,
                startDate: c.startDate,
                endDate: c.endDate,
                status: c.status,
                contributed,
                currency: c.donations[0]?.currency ?? 'INR',
                taskId: c.taskId,
                template: c.task?.template,
                impact: {
                    wasteBagsEstimate: c.task?.template === 'WASTE_COLLECTION' ? Math.round(contributed / 500) : null,
                    treesEstimate: c.task?.template === 'PLANTATION' ? Math.round(contributed / 200) : null,
                    verifiedWasteTotal: impactMetrics.verifiedWasteTotal,
                    approvedReportCount: impactMetrics.approvedReportCount,
                },
            };
        }));
        return {
            data: rows,
            total,
            page,
            limit,
            hasNext: skip + rows.length < total,
        };
    }
    async getReports(donorId, organizationId, q) {
        const campaignIds = await this.repo.findFundedCampaignIds(donorId, organizationId);
        if (!campaignIds.length) {
            return { data: [], total: 0, page: q.page ?? 1, limit: this.clampLimit(q.limit), hasNext: false };
        }
        const page = q.page ?? 1;
        const limit = this.clampLimit(q.limit);
        const skip = (page - 1) * limit;
        const total = await this.repo.countDistinctLinkedApprovedReports(campaignIds, organizationId);
        const list = await this.repo.findLinkedApprovedReportsPage(campaignIds, organizationId, skip, limit);
        return {
            data: list.map((r) => ({
                id: r.id,
                taskId: r.taskId,
                userId: r.userId,
                beforePhotoUrl: r.beforePhotoUrl,
                afterPhotoUrl: r.afterPhotoUrl,
                quantityItems: r.quantityItems,
                wasteCollected: r.quantityItems,
                notes: r.notes,
                timestamp: r.timestamp,
                status: r.status,
                gps: {
                    lat: r.task.geofenceLat,
                    lng: r.task.geofenceLng,
                },
                task: r.task,
                user: r.user,
                approvedBy: r.approvedBy,
            })),
            total,
            page,
            limit,
            hasNext: skip + list.length < total,
        };
    }
    async getDonationHistory(donorId, organizationId) {
        return this.repo.findDonationsHistory(donorId, organizationId);
    }
    async getAnalytics(donorId, organizationId) {
        const campaignIds = await this.repo.findFundedCampaignIds(donorId, organizationId);
        const taskIds = await this.repo.findTaskIdsForFundedCampaigns(campaignIds, organizationId);
        const campaigns = campaignIds.length > 0
            ? await this.repo.findCampaignsSummary(campaignIds, organizationId)
            : [];
        const aggRows = await this.repo.findAllLinkedApprovedReportsForAggregation(campaignIds, organizationId);
        const heatmapBuckets = buildHeatmapBuckets(aggRows);
        const wasteByMonth = new Map();
        for (const r of aggRows) {
            const k = monthKeyUtc(new Date(r.timestamp));
            wasteByMonth.set(k, (wasteByMonth.get(k) ?? 0) + (r.quantityItems ?? 0));
        }
        const wasteTrend = [...wasteByMonth.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, bags]) => ({ month, bags }))
            .slice(-8);
        const attendChunks = await this.repo.aggregateAttendanceSessions(taskIds, organizationId);
        const volunteerParticipation = attendChunks
            .map((a) => ({ userId: a.userId, sessions: a._count.id }))
            .sort((a, b) => b.sessions - a.sessions)
            .slice(0, 12);
        const allC = await this.repo.findDonorCampaignsByIds(campaignIds, organizationId);
        const completed = allC.filter((c) => c.status === client_1.DonorCampaignStatus.COMPLETED).length;
        const campaignSuccessRate = allC.length ? Math.round((completed / allC.length) * 100) : 0;
        const campaignPerformance = await Promise.all(campaigns.map(async (c) => {
            const imp = await this.repo.getCampaignVerifiedImpact(c.id, organizationId);
            return {
                campaignId: c.id,
                title: c.title,
                status: c.status,
                verifiedWasteTotal: imp.verifiedWasteTotal,
                approvedReportCount: imp.approvedReportCount,
                isComplete: c.status === client_1.DonorCampaignStatus.COMPLETED,
            };
        }));
        return {
            heatmapBuckets,
            wasteTrend,
            volunteerParticipation,
            campaignSuccessRate,
            fundedCampaignsTotal: allC.length,
            campaignPerformance,
        };
    }
    async getReportPdfBuffer(donorId, organizationId, reportId) {
        const report = await this.repo.findApprovedReportByIdForDonor(donorId, organizationId, reportId);
        if (!report || report.status !== client_1.ReportStatus.APPROVED) {
            throw new common_1.NotFoundException('Report not found or not available');
        }
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ margin: 48, size: 'A4' });
            const chunks = [];
            doc.on('data', (c) => chunks.push(Buffer.from(c)));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            doc.fontSize(10).fillColor('#666666').text('FieldOps — Verified field report', { align: 'right' });
            doc.moveDown(0.5);
            doc.fontSize(18).fillColor('#0f172a').text(report.task.title, { underline: true });
            doc.moveDown(0.3);
            doc.fontSize(11).fillColor('#334155').text(`${report.task.zoneName}`);
            doc.text(`Recorded: ${report.timestamp.toISOString()}`);
            doc.text(`Volunteer: ${report.user.firstName} ${report.user.lastName}` +
                (report.approvedBy
                    ? `  |  Approved by: ${report.approvedBy.firstName} ${report.approvedBy.lastName}`
                    : ''));
            doc.moveDown();
            doc.fontSize(12).fillColor('#0f172a').text('Impact', { underline: true });
            doc.fontSize(11).fillColor('#334155').text(`Waste / items (reported): ${report.quantityItems ?? '—'}`);
            if (report.notes) {
                doc.moveDown(0.3);
                doc.text(`Notes: ${report.notes}`, { width: 500 });
            }
            doc.moveDown();
            doc.fontSize(10).fillColor('#64748b').text(`GPS: ${report.task.geofenceLat.toFixed(5)}, ${report.task.geofenceLng.toFixed(5)}`);
            doc.text(`Report ID: ${report.id}`);
            doc.end();
        });
    }
};
exports.DonorService = DonorService;
exports.DonorService = DonorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [donor_repository_1.DonorRepository,
        donor_cache_service_1.DonorCacheService])
], DonorService);
//# sourceMappingURL=donor.service.js.map