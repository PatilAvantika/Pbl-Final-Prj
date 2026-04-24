import { DonorRepository } from './donor.repository';
import { DonorCacheService } from './donor-cache.service';
export declare class DonorService {
    private readonly repo;
    private readonly cache;
    constructor(repo: DonorRepository, cache: DonorCacheService);
    private assertDateRange;
    private clampLimit;
    getDashboard(donorId: string, organizationId: string): Promise<{}>;
    getCampaigns(donorId: string, organizationId: string, q: {
        from?: string;
        to?: string;
        location?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: {
            id: string;
            title: string;
            description: string | null;
            zoneName: string;
            lat: number;
            lng: number;
            startDate: Date | null;
            endDate: Date | null;
            status: import("@prisma/client").$Enums.DonorCampaignStatus;
            contributed: number;
            currency: string;
            taskId: string | null;
            template: import("@prisma/client").$Enums.TaskTemplate | undefined;
            impact: {
                wasteBagsEstimate: number | null;
                treesEstimate: number | null;
                verifiedWasteTotal: number;
                approvedReportCount: number;
            };
        }[];
        total: number;
        page: number;
        limit: number;
        hasNext: boolean;
    }>;
    getReports(donorId: string, organizationId: string, q: {
        page?: number;
        limit?: number;
    }): Promise<{
        data: {
            id: string;
            taskId: string;
            userId: string;
            beforePhotoUrl: string | null;
            afterPhotoUrl: string | null;
            quantityItems: number | null;
            wasteCollected: number | null;
            notes: string | null;
            timestamp: Date;
            status: import("@prisma/client").$Enums.ReportStatus;
            gps: {
                lat: number;
                lng: number;
            };
            task: {
                title: string;
                zoneName: string;
                geofenceLat: number;
                geofenceLng: number;
            };
            user: {
                firstName: string;
                lastName: string;
            };
            approvedBy: {
                firstName: string;
                lastName: string;
            } | null;
        }[];
        total: number;
        page: number;
        limit: number;
        hasNext: boolean;
    }>;
    getDonationHistory(donorId: string, organizationId: string): Promise<({
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
    getAnalytics(donorId: string, organizationId: string): Promise<{
        heatmapBuckets: {
            bucketLat: number;
            bucketLng: number;
            reportCount: number;
            density: number;
            label: string;
        }[];
        wasteTrend: {
            month: string;
            bags: number;
        }[];
        volunteerParticipation: {
            userId: string;
            sessions: number;
        }[];
        campaignSuccessRate: number;
        fundedCampaignsTotal: number;
        campaignPerformance: {
            campaignId: string;
            title: string;
            status: import("@prisma/client").$Enums.DonorCampaignStatus;
            verifiedWasteTotal: number;
            approvedReportCount: number;
            isComplete: boolean;
        }[];
    }>;
    getReportPdfBuffer(donorId: string, organizationId: string, reportId: string): Promise<Buffer>;
}
