import { StreamableFile } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { DonorService } from './donor.service';
import { DonorCampaignsQueryDto } from './dto/donor-campaigns-query.dto';
import { DonorReportsQueryDto } from './dto/donor-reports-query.dto';
import { AuditService } from '../audit/audit.service';
type Authed = Request & {
    user: {
        id: string;
        email: string;
        role: Role;
        organizationId?: string;
    };
};
export declare class DonorController {
    private readonly donorService;
    private readonly auditService;
    constructor(donorService: DonorService, auditService: AuditService);
    dashboard(req: Authed): Promise<{}>;
    campaigns(req: Authed, query: DonorCampaignsQueryDto): Promise<{
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
    reports(req: Authed, query: DonorReportsQueryDto): Promise<{
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
    analytics(req: Authed): Promise<{
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
    donationHistory(req: Authed): Promise<({
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
    reportPdf(req: Authed, id: string): Promise<StreamableFile>;
}
export {};
