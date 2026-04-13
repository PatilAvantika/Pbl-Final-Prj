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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonorRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let DonorRepository = class DonorRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findFundedCampaignIds(donorId, organizationId) {
        const rows = await this.prisma.donation.findMany({
            where: {
                donorId,
                campaign: { organizationId },
            },
            distinct: ['campaignId'],
            select: { campaignId: true },
        });
        return rows.map((r) => r.campaignId);
    }
    async findTaskIdsForFundedCampaigns(campaignIds, organizationId) {
        if (!campaignIds.length)
            return [];
        const camps = await this.prisma.donorCampaign.findMany({
            where: { id: { in: campaignIds }, organizationId },
            select: { taskId: true },
        });
        return [...new Set(camps.map((c) => c.taskId).filter((x) => !!x))];
    }
    async findDistinctLinkedReportIds(campaignIds, organizationId) {
        if (!campaignIds.length)
            return [];
        const links = await this.prisma.campaignReport.findMany({
            where: {
                campaignId: { in: campaignIds },
                campaign: { organizationId },
            },
            select: { reportId: true },
        });
        return [...new Set(links.map((l) => l.reportId))];
    }
    async countDistinctLinkedApprovedReports(campaignIds, organizationId) {
        const ids = await this.findDistinctLinkedReportIds(campaignIds, organizationId);
        if (!ids.length)
            return 0;
        return this.prisma.fieldReport.count({
            where: {
                id: { in: ids },
                status: client_1.ReportStatus.APPROVED,
                organizationId,
            },
        });
    }
    async sumWasteDistinctLinkedReports(campaignIds, organizationId) {
        const ids = await this.findDistinctLinkedReportIds(campaignIds, organizationId);
        if (!ids.length)
            return 0;
        const rows = await this.prisma.fieldReport.findMany({
            where: {
                id: { in: ids },
                status: client_1.ReportStatus.APPROVED,
                organizationId,
            },
            select: { quantityItems: true },
        });
        return rows.reduce((s, r) => s + (r.quantityItems ?? 0), 0);
    }
    async findLinkedApprovedReportsPage(campaignIds, organizationId, skip, take) {
        const ids = await this.findDistinctLinkedReportIds(campaignIds, organizationId);
        if (!ids.length)
            return [];
        return this.prisma.fieldReport.findMany({
            where: {
                id: { in: ids },
                status: client_1.ReportStatus.APPROVED,
                organizationId,
            },
            orderBy: { timestamp: 'desc' },
            skip,
            take,
            include: {
                task: { select: { title: true, zoneName: true, geofenceLat: true, geofenceLng: true } },
                user: { select: { firstName: true, lastName: true } },
                approvedBy: { select: { firstName: true, lastName: true } },
            },
        });
    }
    async findAllLinkedApprovedReportsForAggregation(campaignIds, organizationId) {
        const ids = await this.findDistinctLinkedReportIds(campaignIds, organizationId);
        if (!ids.length)
            return [];
        return this.prisma.fieldReport.findMany({
            where: {
                id: { in: ids },
                status: client_1.ReportStatus.APPROVED,
                organizationId,
            },
            select: {
                id: true,
                quantityItems: true,
                timestamp: true,
                task: { select: { geofenceLat: true, geofenceLng: true, template: true } },
            },
        });
    }
    async findApprovedReportByIdForDonor(donorId, organizationId, reportId) {
        const campaignIds = await this.findFundedCampaignIds(donorId, organizationId);
        if (!campaignIds.length)
            return null;
        const link = await this.prisma.campaignReport.findFirst({
            where: {
                reportId,
                campaignId: { in: campaignIds },
                campaign: { organizationId },
            },
        });
        if (!link)
            return null;
        return this.prisma.fieldReport.findFirst({
            where: {
                id: reportId,
                status: client_1.ReportStatus.APPROVED,
                organizationId,
            },
            include: {
                task: true,
                user: { select: { firstName: true, lastName: true } },
                approvedBy: { select: { firstName: true, lastName: true } },
            },
        });
    }
    async findDonationsForDonor(donorId, organizationId) {
        return this.prisma.donation.findMany({
            where: {
                donorId,
                campaign: { organizationId },
            },
            orderBy: { createdAt: 'desc' },
            include: { campaign: true },
        });
    }
    async countDonorCampaignsFiltered(campaignIds, donorId, organizationId, q) {
        const where = this.buildCampaignWhere(campaignIds, organizationId, q);
        return this.prisma.donorCampaign.count({ where });
    }
    async findDonorCampaignsFilteredPage(campaignIds, donorId, organizationId, q, skip, take) {
        const where = this.buildCampaignWhere(campaignIds, organizationId, q);
        return this.prisma.donorCampaign.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            skip,
            take,
            include: {
                donations: { where: { donorId } },
                task: {
                    select: {
                        template: true,
                        id: true,
                        geofenceLat: true,
                        geofenceLng: true,
                    },
                },
            },
        });
    }
    buildCampaignWhere(campaignIds, organizationId, q) {
        const where = {
            id: { in: campaignIds },
            organizationId,
        };
        if (q.status === 'ACTIVE' || q.status === 'COMPLETED') {
            where.status = q.status;
        }
        if (q.location?.trim()) {
            where.zoneName = { contains: q.location.trim(), mode: 'insensitive' };
        }
        const created = {};
        if (q.from) {
            const from = new Date(q.from);
            if (!Number.isNaN(from.getTime()))
                created.gte = from;
        }
        if (q.to) {
            const to = new Date(q.to);
            if (!Number.isNaN(to.getTime())) {
                to.setUTCHours(23, 59, 59, 999);
                created.lte = to;
            }
        }
        if (Object.keys(created).length)
            where.createdAt = created;
        return where;
    }
    async findCampaignsSummary(campaignIds, organizationId) {
        if (!campaignIds.length)
            return [];
        return this.prisma.donorCampaign.findMany({
            where: { id: { in: campaignIds }, organizationId },
            select: { id: true, lat: true, lng: true, title: true, status: true, taskId: true },
        });
    }
    async findDonationsHistory(donorId, organizationId) {
        return this.prisma.donation.findMany({
            where: {
                donorId,
                campaign: { organizationId },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: { campaign: { select: { id: true, title: true, zoneName: true } } },
        });
    }
    async aggregateAttendanceSessions(taskIds, organizationId) {
        if (!taskIds.length)
            return [];
        const scoped = await this.prisma.task.findMany({
            where: { id: { in: taskIds }, organizationId },
            select: { id: true },
        });
        const ids = scoped.map((t) => t.id);
        if (!ids.length)
            return [];
        return this.prisma.attendance.groupBy({
            by: ['userId'],
            where: { taskId: { in: ids }, type: 'CLOCK_IN' },
            _count: { id: true },
        });
    }
    async countClockInsForTasks(taskIds, organizationId) {
        if (!taskIds.length)
            return 0;
        const scoped = await this.prisma.task.findMany({
            where: { id: { in: taskIds }, organizationId },
            select: { id: true },
        });
        const ids = scoped.map((t) => t.id);
        if (!ids.length)
            return 0;
        return this.prisma.attendance.count({
            where: { taskId: { in: ids }, type: 'CLOCK_IN' },
        });
    }
    async findRecentCampaignsForDonor(campaignIds, donorId, organizationId, take) {
        if (!campaignIds.length)
            return [];
        return this.prisma.donorCampaign.findMany({
            where: { id: { in: campaignIds }, organizationId },
            orderBy: { updatedAt: 'desc' },
            take,
            include: {
                donations: { where: { donorId }, select: { amount: true } },
                task: { select: { template: true } },
            },
        });
    }
    async findTaskTemplates(taskIds, organizationId) {
        if (!taskIds.length)
            return [];
        return this.prisma.task.findMany({
            where: { id: { in: taskIds }, organizationId },
            select: { template: true },
        });
    }
    async findDonorCampaignsByIds(campaignIds, organizationId) {
        if (!campaignIds.length)
            return [];
        return this.prisma.donorCampaign.findMany({
            where: { id: { in: campaignIds }, organizationId },
        });
    }
    async getCampaignVerifiedImpact(campaignId, organizationId) {
        const links = await this.prisma.campaignReport.findMany({
            where: {
                campaignId,
                campaign: { id: campaignId, organizationId },
            },
            select: { reportId: true },
        });
        const ids = [...new Set(links.map((l) => l.reportId))];
        if (!ids.length)
            return { verifiedWasteTotal: 0, approvedReportCount: 0 };
        const reports = await this.prisma.fieldReport.findMany({
            where: {
                id: { in: ids },
                status: client_1.ReportStatus.APPROVED,
                organizationId,
            },
            select: { id: true, quantityItems: true },
        });
        const waste = reports.reduce((s, r) => s + (r.quantityItems ?? 0), 0);
        return { verifiedWasteTotal: waste, approvedReportCount: reports.length };
    }
    async findDonorIdsForCampaign(campaignId) {
        const rows = await this.prisma.donation.findMany({
            where: { campaignId },
            distinct: ['donorId'],
            select: { donorId: true },
        });
        return rows.map((r) => r.donorId);
    }
    async findDonorIdsLinkedToReport(reportId) {
        const links = await this.prisma.campaignReport.findMany({
            where: { reportId },
            select: { campaignId: true },
        });
        if (!links.length)
            return [];
        const campaignIds = [...new Set(links.map((l) => l.campaignId))];
        const donors = await this.prisma.donation.findMany({
            where: { campaignId: { in: campaignIds } },
            distinct: ['donorId'],
            select: { donorId: true },
        });
        return donors.map((d) => d.donorId);
    }
};
exports.DonorRepository = DonorRepository;
exports.DonorRepository = DonorRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DonorRepository);
//# sourceMappingURL=donor.repository.js.map