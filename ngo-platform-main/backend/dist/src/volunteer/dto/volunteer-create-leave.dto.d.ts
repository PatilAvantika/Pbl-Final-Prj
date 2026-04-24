import { LeaveType } from '@prisma/client';
export declare class VolunteerCreateLeaveDto {
    type: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
}
