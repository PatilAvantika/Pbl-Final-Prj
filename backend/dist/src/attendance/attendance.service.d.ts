import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
export declare class ClockInDto {
    taskId: string;
    lat: number;
    lng: number;
    accuracyMeters: number;
    uniqueRequestId: string;
    deviceId: string;
    imageHash?: string;
    imageUrl?: string;
}
export declare class AttendanceService {
    private prisma;
    private tasksService;
    constructor(prisma: PrismaService, tasksService: TasksService);
    clockIn(userId: string, data: ClockInDto): Promise<{
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
    getMyAttendances(userId: string): Promise<({
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
    getAllAttendances(): Promise<({
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
