import { VolunteerService } from './volunteer.service';
import { VolunteerCreateLeaveDto } from './dto/volunteer-create-leave.dto';
export declare class VolunteerController {
    private readonly volunteerService;
    constructor(volunteerService: VolunteerService);
    getDashboard(req: {
        user: {
            id: string;
            organizationId?: string;
        };
    }): Promise<import("./volunteer.service").VolunteerDashboardDto>;
    getProfile(req: {
        user: {
            id: string;
        };
    }): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
        timezone: string | null;
    }>;
    getLeaveSummary(req: {
        user: {
            id: string;
        };
    }): Promise<{
        pending: number;
        approved: number;
        rejected: number;
        total: number;
    }>;
    getLeaves(req: {
        user: {
            id: string;
        };
    }): Promise<{
        status: import("@prisma/client").$Enums.LeaveStatus;
        id: string;
        userId: string;
        type: import("@prisma/client").$Enums.LeaveType;
        reason: string;
        startDate: Date;
        endDate: Date;
    }[]>;
    createLeave(req: {
        user: {
            id: string;
        };
    }, body: VolunteerCreateLeaveDto): Promise<{
        status: import("@prisma/client").$Enums.LeaveStatus;
        id: string;
        userId: string;
        type: import("@prisma/client").$Enums.LeaveType;
        reason: string;
        startDate: Date;
        endDate: Date;
    }>;
    cancelLeave(leaveId: string, req: {
        user: {
            id: string;
        };
    }): Promise<void>;
}
