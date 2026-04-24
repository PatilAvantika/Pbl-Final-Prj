import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class DonorRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findFundedCampaignIds(donorId: string, organizationId: string): Promise<string[]>;
    findTaskIdsForFundedCampaigns(campaignIds: string[], organizationId: string): Promise<string[]>;
    findDistinctLinkedReportIds(campaignIds: string[], organizationId: string): Promise<string[]>;
    countDistinctLinkedApprovedReports(campaignIds: string[], organizationId: string): Promise<number>;
    sumWasteDistinctLinkedReports(campaignIds: string[], organizationId: string): Promise<number>;
    findLinkedApprovedReportsPage(campaignIds: string[], organizationId: string, skip: number, take: number): Promise<({
        user: {
            firstName: string;
            lastName: string;
        };
        task: {
            title: string;
            zoneName: string;
            geofenceLat: number;
            geofenceLng: number;
        };
        approvedBy: {
            firstName: string;
            lastName: string;
        } | null;
    } & {
        organizationId: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        id: string;
        userId: string;
        taskId: string;
        timestamp: Date;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
        aiSummary: string | null;
        approvedById: string | null;
        approvedAt: Date | null;
    })[]>;
    findAllLinkedApprovedReportsForAggregation(campaignIds: string[], organizationId: string): Promise<{
        task: {
            template: import("@prisma/client").$Enums.TaskTemplate;
            geofenceLat: number;
            geofenceLng: number;
        };
        id: string;
        timestamp: Date;
        quantityItems: number | null;
    }[]>;
    findApprovedReportByIdForDonor(donorId: string, organizationId: string, reportId: string): Promise<({
        user: {
            firstName: string;
            lastName: string;
        };
        task: {
            organizationId: string;
            isActive: boolean;
            lifecycleStatus: import("@prisma/client").$Enums.TaskLifecycleStatus;
            id: string;
            title: string;
            description: string | null;
            template: import("@prisma/client").$Enums.TaskTemplate;
            zoneName: string;
            geofenceLat: number;
            geofenceLng: number;
            geofenceRadius: number;
            startTime: Date;
            endTime: Date;
            priority: string | null;
            maxVolunteers: number | null;
            teamLeaderId: string | null;
        };
        approvedBy: {
            firstName: string;
            lastName: string;
        } | null;
    } & {
        organizationId: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        id: string;
        userId: string;
        taskId: string;
        timestamp: Date;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
        aiSummary: string | null;
        approvedById: string | null;
        approvedAt: Date | null;
    }) | null>;
    findDonationsForDonor(donorId: string, organizationId: string): Promise<({
        campaign: {
            organizationId: string;
            status: import("@prisma/client").$Enums.DonorCampaignStatus;
            id: string;
            createdAt: Date;
            taskId: string | null;
            lat: number;
            lng: number;
            title: string;
            description: string | null;
            zoneName: string;
            startDate: Date | null;
            endDate: Date | null;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        donorId: string;
        campaignId: string;
        amount: number;
        currency: string;
    })[]>;
    countDonorCampaignsFiltered(campaignIds: string[], donorId: string, organizationId: string, q: {
        from?: string;
        to?: string;
        location?: string;
        status?: string;
    }): Promise<number>;
    findDonorCampaignsFilteredPage(campaignIds: string[], donorId: string, organizationId: string, q: {
        from?: string;
        to?: string;
        location?: string;
        status?: string;
    }, skip: number, take: number): Promise<({
        task: {
            id: string;
            template: import("@prisma/client").$Enums.TaskTemplate;
            geofenceLat: number;
            geofenceLng: number;
        } | null;
        donations: {
            id: string;
            createdAt: Date;
            donorId: string;
            campaignId: string;
            amount: number;
            currency: string;
        }[];
    } & {
        organizationId: string;
        status: import("@prisma/client").$Enums.DonorCampaignStatus;
        id: string;
        createdAt: Date;
        taskId: string | null;
        lat: number;
        lng: number;
        title: string;
        description: string | null;
        zoneName: string;
        startDate: Date | null;
        endDate: Date | null;
        updatedAt: Date;
    })[]>;
    private buildCampaignWhere;
    findCampaignsSummary(campaignIds: string[], organizationId: string): Promise<{
        status: import("@prisma/client").$Enums.DonorCampaignStatus;
        id: string;
        taskId: string | null;
        lat: number;
        lng: number;
        title: string;
    }[]>;
    findDonationsHistory(donorId: string, organizationId: string): Promise<({
        campaign: {
            id: string;
            title: string;
            zoneName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        donorId: string;
        campaignId: string;
        amount: number;
        currency: string;
    })[]>;
    aggregateAttendanceSessions(taskIds: string[], organizationId: string): Promise<(Prisma.PickEnumerable<Prisma.AttendanceGroupByOutputType, "userId"[]> & {
        _count: {
            id: number;
        };
    })[]>;
    countClockInsForTasks(taskIds: string[], organizationId: string): Promise<number>;
    findRecentCampaignsForDonor(campaignIds: string[], donorId: string, organizationId: string, take: number): Promise<({
        task: {
            template: import("@prisma/client").$Enums.TaskTemplate;
        } | null;
        donations: {
            amount: number;
        }[];
    } & {
        organizationId: string;
        status: import("@prisma/client").$Enums.DonorCampaignStatus;
        id: string;
        createdAt: Date;
        taskId: string | null;
        lat: number;
        lng: number;
        title: string;
        description: string | null;
        zoneName: string;
        startDate: Date | null;
        endDate: Date | null;
        updatedAt: Date;
    })[]>;
    findTaskTemplates(taskIds: string[], organizationId: string): Promise<{
        template: import("@prisma/client").$Enums.TaskTemplate;
    }[]>;
    findDonorCampaignsByIds(campaignIds: string[], organizationId: string): Promise<{
        organizationId: string;
        status: import("@prisma/client").$Enums.DonorCampaignStatus;
        id: string;
        createdAt: Date;
        taskId: string | null;
        lat: number;
        lng: number;
        title: string;
        description: string | null;
        zoneName: string;
        startDate: Date | null;
        endDate: Date | null;
        updatedAt: Date;
    }[]>;
    getCampaignVerifiedImpact(campaignId: string, organizationId: string): Promise<{
        verifiedWasteTotal: number;
        approvedReportCount: number;
    }>;
    findDonorIdsForCampaign(campaignId: string): Promise<string[]>;
    findDonorIdsLinkedToReport(reportId: string): Promise<string[]>;
}
