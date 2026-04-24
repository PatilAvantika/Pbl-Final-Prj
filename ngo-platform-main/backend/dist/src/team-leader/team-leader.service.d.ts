import { PrismaService } from '../prisma/prisma.service';
export declare class TeamLeaderService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboard(userId: string, organizationId: string): Promise<{
        totalTasks: number;
        activeTasks: number;
        totalVolunteers: number;
        attendanceToday: number;
        reportsSubmitted: number;
        reportsPending: number;
        reportsApproved: number;
        reportsRejected: number;
    }>;
}
