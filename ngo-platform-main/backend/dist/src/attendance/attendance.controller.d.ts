import { AttendanceService } from './attendance.service';
import { ClockInDto } from './dto/clock-in.dto';
declare class AttendanceOverrideDto {
    attendanceId: string;
    reason: string;
    action: 'APPROVE' | 'REJECT' | 'CORRECT';
}
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    clockIn(req: any, data: ClockInDto): Promise<{
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        id: string;
        deviceId: string;
        userId: string;
        taskId: string | null;
        timestamp: Date;
        type: string;
        lat: number;
        lng: number;
        accuracyMeters: number;
        reverseGeoName: string | null;
        imageHash: string | null;
        imageUrl: string | null;
        uniqueRequestId: string;
    }>;
    clockOut(req: any, data: ClockInDto): Promise<{
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        id: string;
        deviceId: string;
        userId: string;
        taskId: string | null;
        timestamp: Date;
        type: string;
        lat: number;
        lng: number;
        accuracyMeters: number;
        reverseGeoName: string | null;
        imageHash: string | null;
        imageUrl: string | null;
        uniqueRequestId: string;
    }>;
    getMyAttendances(req: any): Promise<({
        task: {
            organizationId: string;
            isActive: boolean;
            lifecycleStatus: import("@prisma/client").$Enums.TaskLifecycleStatus;
            id: string;
            title: string;
            description: string | null;
            template: import("@prisma/client").$Enums.TaskTemplate;
            zoneName: string;
            geofenceLat: number;
            geofenceLng: number;
            geofenceRadius: number;
            startTime: Date;
            endTime: Date;
            priority: string | null;
            maxVolunteers: number | null;
            teamLeaderId: string | null;
        } | null;
    } & {
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        id: string;
        deviceId: string;
        userId: string;
        taskId: string | null;
        timestamp: Date;
        type: string;
        lat: number;
        lng: number;
        accuracyMeters: number;
        reverseGeoName: string | null;
        imageHash: string | null;
        imageUrl: string | null;
        uniqueRequestId: string;
    })[]>;
    listAttendanceForTask(taskId: string, req: any): Promise<{
        userId: string;
        name: string;
        clockInAt: string | null;
        clockOutAt: string | null;
        status: "PRESENT" | "NOT_CHECKED_IN" | "CHECKED_OUT";
    }[]>;
    teamLive(): Promise<{
        id: string;
        volunteerId: string;
        name: string;
        checkInAt: string;
        gpsOk: boolean;
        faceVerified: boolean;
        suspicious: boolean;
    }[]>;
    override(req: any, body: AttendanceOverrideDto): Promise<{
        success: boolean;
        attendanceId: string;
        action: string;
    }>;
    getAll(): Promise<({
        user: {
            role: import("@prisma/client").$Enums.Role;
            firstName: string;
            lastName: string;
        };
        task: {
            title: string;
            zoneName: string;
        } | null;
    } & {
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        id: string;
        deviceId: string;
        userId: string;
        taskId: string | null;
        timestamp: Date;
        type: string;
        lat: number;
        lng: number;
        accuracyMeters: number;
        reverseGeoName: string | null;
        imageHash: string | null;
        imageUrl: string | null;
        uniqueRequestId: string;
    })[]>;
}
export {};
