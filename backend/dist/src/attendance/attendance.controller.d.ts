import { AttendanceService, ClockInDto } from './attendance.service';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    clockIn(req: any, data: ClockInDto): Promise<{
        id: string;
        deviceId: string;
        timestamp: Date;
        type: string;
        lat: number;
        lng: number;
        accuracyMeters: number;
        reverseGeoName: string | null;
        imageHash: string | null;
        imageUrl: string | null;
        uniqueRequestId: string;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        taskId: string | null;
        userId: string;
    }>;
    getMyAttendances(req: any): Promise<({
        task: {
            id: string;
            isActive: boolean;
            title: string;
            description: string | null;
            template: import("@prisma/client").$Enums.TaskTemplate;
            zoneName: string;
            geofenceLat: number;
            geofenceLng: number;
            geofenceRadius: number;
            startTime: Date;
            endTime: Date;
        } | null;
    } & {
        id: string;
        deviceId: string;
        timestamp: Date;
        type: string;
        lat: number;
        lng: number;
        accuracyMeters: number;
        reverseGeoName: string | null;
        imageHash: string | null;
        imageUrl: string | null;
        uniqueRequestId: string;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        taskId: string | null;
        userId: string;
    })[]>;
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
        id: string;
        deviceId: string;
        timestamp: Date;
        type: string;
        lat: number;
        lng: number;
        accuracyMeters: number;
        reverseGeoName: string | null;
        imageHash: string | null;
        imageUrl: string | null;
        uniqueRequestId: string;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        taskId: string | null;
        userId: string;
    })[]>;
}
