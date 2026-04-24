import { Injectable } from '@nestjs/common';
import { DonorCampaignStatus, Prisma, ReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DonorRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findFundedCampaignIds(donorId: string, organizationId: string): Promise<string[]> {
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

    /** Tasks linked to donor-funded campaigns (same org) — for volunteer-hours proxy only. */
    async findTaskIdsForFundedCampaigns(campaignIds: string[], organizationId: string): Promise<string[]> {
        if (!campaignIds.length) return [];
        const camps = await this.prisma.donorCampaign.findMany({
            where: { id: { in: campaignIds }, organizationId },
            select: { taskId: true },
        });
        return [...new Set(camps.map((c) => c.taskId).filter((x): x is string => !!x))];
    }

    /**
     * Distinct APPROVED report IDs visible to donor: must appear in CampaignReport
     * for a campaign the donor funded (tenant-scoped).
     */
    async findDistinctLinkedReportIds(campaignIds: string[], organizationId: string): Promise<string[]> {
        if (!campaignIds.length) return [];
        const links = await this.prisma.campaignReport.findMany({
            where: {
                campaignId: { in: campaignIds },
                campaign: { organizationId },
            },
            select: { reportId: true },
        });
        return [...new Set(links.map((l) => l.reportId))];
    }

    async countDistinctLinkedApprovedReports(campaignIds: string[], organizationId: string): Promise<number> {
        const ids = await this.findDistinctLinkedReportIds(campaignIds, organizationId);
        if (!ids.length) return 0;
        return this.prisma.fieldReport.count({
            where: {
                id: { in: ids },
                status: ReportStatus.APPROVED,
                organizationId,
            },
        });
    }

    /** Sum quantityItems once per distinct report id (no double-count across campaigns). */
    async sumWasteDistinctLinkedReports(campaignIds: string[], organizationId: string): Promise<number> {
        const ids = await this.findDistinctLinkedReportIds(campaignIds, organizationId);
        if (!ids.length) return 0;
        const rows = await this.prisma.fieldReport.findMany({
            where: {
                id: { in: ids },
                status: ReportStatus.APPROVED,
                organizationId,
            },
            select: { quantityItems: true },
        });
        return rows.reduce((s, r) => s + (r.quantityItems ?? 0), 0);
    }

    async findLinkedApprovedReportsPage(
        campaignIds: string[],
        organizationId: string,
        skip: number,
        take: number,
    ) {
        const ids = await this.findDistinctLinkedReportIds(campaignIds, organizationId);
        if (!ids.length) return [];
        return this.prisma.fieldReport.findMany({
            where: {
                id: { in: ids },
                status: ReportStatus.APPROVED,
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

    async findAllLinkedApprovedReportsForAggregation(campaignIds: string[], organizationId: string) {
        const ids = await this.findDistinctLinkedReportIds(campaignIds, organizationId);
        if (!ids.length) return [];
        return this.prisma.fieldReport.findMany({
            where: {
                id: { in: ids },
                status: ReportStatus.APPROVED,
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

    async findApprovedReportByIdForDonor(donorId: string, organizationId: string, reportId: string) {
        const campaignIds = await this.findFundedCampaignIds(donorId, organizationId);
        if (!campaignIds.length) return null;

        const link = await this.prisma.campaignReport.findFirst({
            where: {
                reportId,
                campaignId: { in: campaignIds },
                campaign: { organizationId },
            },
        });
        if (!link) return null;

        return this.prisma.fieldReport.findFirst({
            where: {
                id: reportId,
                status: ReportStatus.APPROVED,
                organizationId,
            },
            include: {
                task: true,
                user: { select: { firstName: true, lastName: true } },
                approvedBy: { select: { firstName: true, lastName: true } },
            },
        });
    }

    async findDonationsForDonor(donorId: string, organizationId: string) {
        return this.prisma.donation.findMany({
            where: {
                donorId,
                campaign: { organizationId },
            },
            orderBy: { createdAt: 'desc' },
            include: { campaign: true },
        });
    }

    async countDonorCampaignsFiltered(
        campaignIds: string[],
        donorId: string,
        organizationId: string,
        q: { from?: string; to?: string; location?: string; status?: string },
    ): Promise<number> {
        const where = this.buildCampaignWhere(campaignIds, organizationId, q);
        return this.prisma.donorCampaign.count({ where });
    }

    async findDonorCampaignsFilteredPage(
        campaignIds: string[],
        donorId: string,
        organizationId: string,
        q: { from?: string; to?: string; location?: string; status?: string },
        skip: number,
        take: number,
    ) {
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

    private buildCampaignWhere(
        campaignIds: string[],
        organizationId: string,
        q: { from?: string; to?: string; location?: string; status?: string },
    ): Prisma.DonorCampaignWhereInput {
        const where: Prisma.DonorCampaignWhereInput = {
            id: { in: campaignIds },
            organizationId,
        };

        if (q.status === 'ACTIVE' || q.status === 'COMPLETED') {
            where.status = q.status as DonorCampaignStatus;
        }
        if (q.location?.trim()) {
            where.zoneName = { contains: q.location.trim(), mode: 'insensitive' };
        }
        const created: Prisma.DateTimeFilter = {};
        if (q.from) {
            const from = new Date(q.from);
            if (!Number.isNaN(from.getTime())) created.gte = from;
        }
        if (q.to) {
            const to = new Date(q.to);
            if (!Number.isNaN(to.getTime())) {
                to.setUTCHours(23, 59, 59, 999);
                created.lte = to;
            }
        }
        if (Object.keys(created).length) where.createdAt = created;
        return where;
    }

    async findCampaignsSummary(campaignIds: string[], organizationId: string) {
        if (!campaignIds.length) return [];
        return this.prisma.donorCampaign.findMany({
            where: { id: { in: campaignIds }, organizationId },
            select: { id: true, lat: true, lng: true, title: true, status: true, taskId: true },
        });
    }

    async findDonationsHistory(donorId: string, organizationId: string) {
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

    async aggregateAttendanceSessions(taskIds: string[], organizationId: string) {
        if (!taskIds.length) return [];
        const scoped = await this.prisma.task.findMany({
            where: { id: { in: taskIds }, organizationId },
            select: { id: true },
        });
        const ids = scoped.map((t) => t.id);
        if (!ids.length) return [];
        return this.prisma.attendance.groupBy({
            by: ['userId'],
            where: { taskId: { in: ids }, type: 'CLOCK_IN' },
            _count: { id: true },
        });
    }

    async countClockInsForTasks(taskIds: string[], organizationId: string): Promise<number> {
        if (!taskIds.length) return 0;
        const scoped = await this.prisma.task.findMany({
            where: { id: { in: taskIds }, organizationId },
            select: { id: true },
        });
        const ids = scoped.map((t) => t.id);
        if (!ids.length) return 0;
        return this.prisma.attendance.count({
            where: { taskId: { in: ids }, type: 'CLOCK_IN' },
        });
    }

    async findRecentCampaignsForDonor(
        campaignIds: string[],
        donorId: string,
        organizationId: string,
        take: number,
    ) {
        if (!campaignIds.length) return [];
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

    async findTaskTemplates(taskIds: string[], organizationId: string) {
        if (!taskIds.length) return [];
        return this.prisma.task.findMany({
            where: { id: { in: taskIds }, organizationId },
            select: { template: true },
        });
    }

    async findDonorCampaignsByIds(campaignIds: string[], organizationId: string) {
        if (!campaignIds.length) return [];
        return this.prisma.donorCampaign.findMany({
            where: { id: { in: campaignIds }, organizationId },
        });
    }

    /**
     * Impact for one campaign: only reports explicitly linked via CampaignReport (APPROVED, same org).
     */
    async getCampaignVerifiedImpact(campaignId: string, organizationId: string): Promise<{
        verifiedWasteTotal: number;
        approvedReportCount: number;
    }> {
        const links = await this.prisma.campaignReport.findMany({
            where: {
                campaignId,
                campaign: { id: campaignId, organizationId },
            },
            select: { reportId: true },
        });
        const ids = [...new Set(links.map((l) => l.reportId))];
        if (!ids.length) return { verifiedWasteTotal: 0, approvedReportCount: 0 };

        const reports = await this.prisma.fieldReport.findMany({
            where: {
                id: { in: ids },
                status: ReportStatus.APPROVED,
                organizationId,
            },
            select: { id: true, quantityItems: true },
        });

        const waste = reports.reduce((s, r) => s + (r.quantityItems ?? 0), 0);
        return { verifiedWasteTotal: waste, approvedReportCount: reports.length };
    }

    async findDonorIdsForCampaign(campaignId: string): Promise<string[]> {
        const rows = await this.prisma.donation.findMany({
            where: { campaignId },
            distinct: ['donorId'],
            select: { donorId: true },
        });
        return rows.map((r) => r.donorId);
    }

    async findDonorIdsLinkedToReport(reportId: string): Promise<string[]> {
        const links = await this.prisma.campaignReport.findMany({
            where: { reportId },
            select: { campaignId: true },
        });
        if (!links.length) return [];
        const campaignIds = [...new Set(links.map((l) => l.campaignId))];
        const donors = await this.prisma.donation.findMany({
            where: { campaignId: { in: campaignIds } },
            distinct: ['donorId'],
            select: { donorId: true },
        });
        return donors.map((d) => d.donorId);
    }
}
