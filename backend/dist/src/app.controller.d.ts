import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AdminDashboardService } from './admin/admin-dashboard.service';
import { AdminMapDataService } from './admin/admin-map-data.service';
export declare class AppController {
    private readonly appService;
    private readonly prisma;
    private readonly adminDashboard;
    private readonly adminMapData;
    constructor(appService: AppService, prisma: PrismaService, adminDashboard: AdminDashboardService, adminMapData: AdminMapDataService);
    getHello(): string;
    getHealth(): {
        status: string;
        timestamp: string;
    };
    getReady(): Promise<{
        status: string;
        timestamp: string;
    }>;
    testAi(): Promise<{
        keyLoaded: boolean;
        response: string | null;
    }>;
    getAdminDashboard(req: {
        user?: {
            organizationId?: string;
        };
    }): Promise<{
        activeTasks: number;
        volunteersOnField: number;
        reportsPending: number;
        syncFailures: number;
    }>;
    getAdminMapData(req: {
        user?: {
            organizationId?: string;
        };
    }): Promise<{
        tasks: Array<{
            id: string;
            title: string;
            lat: number;
            lng: number;
            radius: number;
        }>;
        volunteers: Array<{
            id: string;
            name: string;
            lat: number;
            lng: number;
            status: "ACTIVE" | "INACTIVE";
        }>;
    }>;
    getAdminMetrics(from?: string, to?: string): Promise<{
        range: {
            from: string;
            to: string;
        };
        kpis: {
            activeTasks: number;
            volunteersOnField: number;
            reportsPending: number;
            reportsInRange: number;
            leavePending: number;
            payslipsInRange: number;
            syncFailures: number;
        };
        recentActivity: {
            id: string;
            action: import("@prisma/client").$Enums.AuditAction;
            entityType: string;
            createdAt: Date;
            actorName: string;
        }[];
    }>;
}
