import { PrismaService } from '../prisma/prisma.service';
import { LeaveType } from '@prisma/client';
import { DecisionIntelligenceService } from '../analytics/decision-intelligence.service';
export type VolunteerDashboardDto = {
    totalHours: number;
    activeDays: number;
    tasksCompleted: number;
    streakDays: number;
};
export declare class VolunteerService {
    private readonly prisma;
    private readonly decisionIntelligence;
    constructor(prisma: PrismaService, decisionIntelligence: DecisionIntelligenceService);
    private toLocalDateKey;
    private monthBounds;
    getDashboardStats(userId: string, organizationId: string): Promise<VolunteerDashboardDto>;
    getProfile(userId: string): Promise<{
        reliability_score: number;
        reliability_category: import("../analytics/decision-intelligence.service").ReliabilityCategory;
        reliability_badge: string;
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
