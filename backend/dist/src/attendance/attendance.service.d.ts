import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { Role } from '@prisma/client';
import type { ClockInDto } from './dto/clock-in.dto';
import { VolunteerCacheService } from '../volunteer/volunteer-cache.service';
type AttendanceType = 'CLOCK_IN' | 'CLOCK_OUT';
export type MarkAttendanceInput = ClockInDto & {
    type: AttendanceType;
    image?: string;
    imageSequence?: string[];
};
export declare class AttendanceService {
    private prisma;
    private tasksService;
    private readonly volunteerCache?;
    private readonly logger;
    constructor(prisma: PrismaService, tasksService: TasksService, volunteerCache?: VolunteerCacheService | undefined);
    private findGloballyOpenTaskId;
    private invalidateVolunteerDashboard;
    private getUserFaceTemplate;
    private validateAttendanceWindow;
    private fetchMarkAttendanceTask;
    private getAttendanceFrames;
    private compareFaceTemplate;
    private dayBounds;
    private validateTaskWindowAndGeofence;
    markAttendance(userId: string, role: Role, organizationId: string, data: MarkAttendanceInput): Promise<{
        success: boolean;
        message: string;
        faceMatchScore: number;
        attendance: {
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
            faceMatchScore: number | null;
            uniqueRequestId: string;
        };
    }>;
    clockIn(userId: string, role: Role, organizationId: string, data: ClockInDto): Promise<{
        success: boolean;
        message: string;
        faceMatchScore: number;
        attendance: {
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
            faceMatchScore: number | null;
            uniqueRequestId: string;
        };
    }>;
    clockOut(userId: string, role: Role, organizationId: string, data: ClockInDto): Promise<{
        success: boolean;
        message: string;
        faceMatchScore: number;
        attendance: {
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
            faceMatchScore: number | null;
            uniqueRequestId: string;
        };
    }>;
    getMyAttendances(userId: string): Promise<({
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
        faceMatchScore: number | null;
        uniqueRequestId: string;
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
        faceMatchScore: number | null;
        uniqueRequestId: string;
    })[]>;
    listAttendanceForTask(taskId: string, organizationId: string, actorId: string, role: Role): Promise<{
        userId: string;
        name: string;
        clockInAt: string | null;
        clockOutAt: string | null;
        status: "PRESENT" | "NOT_CHECKED_IN" | "CHECKED_OUT";
    }[]>;
    listTeamLive(): Promise<{
        id: string;
        volunteerId: string;
        name: string;
        checkInAt: string;
        gpsOk: boolean;
        faceMatchScore: number | null;
        suspicious: boolean;
    }[]>;
    recordAttendanceOverride(_actorId: string, body: {
        attendanceId: string;
        reason: string;
        action: string;
    }): Promise<{
        success: boolean;
        attendanceId: string;
        action: string;
    }>;
}
export {};
