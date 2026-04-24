import { PrismaService } from '../prisma/prisma.service';
import { LeaveType } from '@prisma/client';
export type VolunteerDashboardDto = {
    totalHours: number;
    activeDays: number;
    tasksCompleted: number;
    streakDays: number;
};
export declare class VolunteerService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toLocalDateKey;
    private monthBounds;
    getDashboardStats(userId: string, organizationId: string): Promise<VolunteerDashboardDto>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
        timezone: string | null;
    }>;
    getLeaveSummary(userId: string): Promise<{
        pending: number;
        approved: number;
        rejected: number;
        total: number;
    }>;
    getLeaves(userId: string): Promise<{
        status: import("@prisma/client").$Enums.LeaveStatus;
        id: string;
        userId: string;
        type: import("@prisma/client").$Enums.LeaveType;
        reason: string;
        startDate: Date;
        endDate: Date;
    }[]>;
    createLeave(userId: string, data: {
        type: LeaveType;
        startDate: Date;
        endDate: Date;
        reason: string;
    }): Promise<{
        status: import("@prisma/client").$Enums.LeaveStatus;
        id: string;
        userId: string;
        type: import("@prisma/client").$Enums.LeaveType;
        reason: string;
        startDate: Date;
        endDate: Date;
    }>;
    cancelLeave(leaveId: string, userId: string): Promise<void>;
}
