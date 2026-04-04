import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { Role } from '@prisma/client';
import type { ClockInDto } from './dto/clock-in.dto';
export declare class AttendanceService {
    private prisma;
    private tasksService;
    constructor(prisma: PrismaService, tasksService: TasksService);
    private dayBounds;
    private validateTaskWindowAndGeofence;
    clockIn(userId: string, role: Role, data: ClockInDto): Promise<{
        id: string;
        userId: string;
        taskId: string | null;
        timestamp: Date;
        type: string;
        lat: number;
        lng: number;
        accuracyMeters: number;
        reverseGeoName: string | null;
        deviceId: string;
        imageHash: string | null;
        imageUrl: string | null;
        uniqueRequestId: string;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
    }>;
    clockOut(userId: string, role: Role, data: ClockInDto): Promise<{
        id: string;
        userId: string;
        taskId: string | null;
        timestamp: Date;
        type: string;
        lat: number;
        lng: number;
        accuracyMeters: number;
        reverseGeoName: string | null;
        deviceId: string;
        imageHash: string | null;
        imageUrl: string | null;
        uniqueRequestId: string;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
    }>;
    getMyAttendances(userId: string): Promise<({
        task: {
            isActive: boolean;
            id: string;
            geofenceLat: number;
            startTime: Date;
            endTime: Date;
            title: string;
            description: string | null;
            template: import("@prisma/client").$Enums.TaskTemplate;
            zoneName: string;
            geofenceLng: number;
            geofenceRadius: number;
        } | null;
    } & {
        id: string;
        userId: string;
        taskId: string | null;
        timestamp: Date;
        type: string;
        lat: number;
        lng: number;
        accuracyMeters: number;
        reverseGeoName: string | null;
        deviceId: string;
        imageHash: string | null;
        imageUrl: string | null;
        uniqueRequestId: string;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
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
        userId: string;
        taskId: string | null;
        timestamp: Date;
        type: string;
        lat: number;
        lng: number;
        accuracyMeters: number;
        reverseGeoName: string | null;
        deviceId: string;
        imageHash: string | null;
        imageUrl: string | null;
        uniqueRequestId: string;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
    })[]>;
}
