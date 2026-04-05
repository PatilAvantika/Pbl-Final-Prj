import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
export declare class AppController {
    private readonly appService;
    private readonly prisma;
    constructor(appService: AppService, prisma: PrismaService);
    getHello(): string;
    getHealth(): {
        status: string;
        timestamp: string;
    };
    getReady(): Promise<{
        status: string;
        timestamp: string;
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
