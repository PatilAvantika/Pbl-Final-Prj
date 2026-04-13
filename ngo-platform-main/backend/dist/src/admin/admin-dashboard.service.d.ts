import { PrismaService } from '../prisma/prisma.service';
export declare class AdminDashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private userHasOpenClockInToday;
    getDashboardKpis(organizationId: string): Promise<{
        activeTasks: number;
        volunteersOnField: number;
        reportsPending: number;
        syncFailures: number;
    }>;
}
