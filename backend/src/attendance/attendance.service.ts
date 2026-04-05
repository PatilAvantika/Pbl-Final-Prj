import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { getDistanceFromLatLonInMeters } from '../utils/geo.util';
import { Role, SyncStatus } from '@prisma/client';

export class ClockInDto {
    taskId: string;
    lat: number;
    lng: number;
    accuracyMeters: number;
    uniqueRequestId: string;
    deviceId: string;
    imageHash?: string;
    imageUrl?: string;
}

@Injectable()
export class AttendanceService {
    constructor(
        private prisma: PrismaService,
        private tasksService: TasksService
    ) { }

    private dayBounds() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return { now, startOfDay, endOfDay };
    }

    private async validateTaskWindowAndGeofence(userId: string, role: Role, taskId: string, data: ClockInDto) {
        const task = await this.tasksService.findOneForRequester(taskId, userId, role);
        const { now } = this.dayBounds();
        if (now < task.startTime || now > task.endTime) {
            throw new BadRequestException('Task is not currently active');
        }
        const distance = getDistanceFromLatLonInMeters(data.lat, data.lng, task.geofenceLat, task.geofenceLng);
        const buffer = data.accuracyMeters > 0 ? data.accuracyMeters : 20;
        if (distance > task.geofenceRadius + buffer) {
            throw new BadRequestException(
                `Geofence violation. You are ${Math.round(distance)}m away from task zone, max allowed is ${task.geofenceRadius}m.`,
            );
        }
        return task;
    }

    async clockIn(userId: string, role: Role, data: ClockInDto) {
        const existingReq = await this.prisma.attendance.findUnique({
            where: { uniqueRequestId: data.uniqueRequestId },
        });
        if (existingReq) return existingReq;

        await this.validateTaskWindowAndGeofence(userId, role, data.taskId, data);

        const { startOfDay, endOfDay } = this.dayBounds();

        const existingClockIn = await this.prisma.attendance.findFirst({
            where: {
                userId,
                taskId: data.taskId,
                type: 'CLOCK_IN',
                timestamp: { gte: startOfDay, lte: endOfDay },
            },
        });

        if (existingClockIn) {
            throw new ConflictException('You have already clocked in for this task today.');
        }

        return this.prisma.attendance.create({
            data: {
                userId,
                taskId: data.taskId,
                type: 'CLOCK_IN',
                lat: data.lat,
                lng: data.lng,
                accuracyMeters: data.accuracyMeters,
                deviceId: data.deviceId,
                uniqueRequestId: data.uniqueRequestId,
                imageHash: data.imageHash,
                imageUrl: data.imageUrl,
                syncStatus: SyncStatus.SYNCED,
            },
        });
    }

    async clockOut(userId: string, role: Role, data: ClockInDto) {
        const existingReq = await this.prisma.attendance.findUnique({
            where: { uniqueRequestId: data.uniqueRequestId },
        });
        if (existingReq) return existingReq;

        await this.validateTaskWindowAndGeofence(userId, role, data.taskId, data);

        const { startOfDay, endOfDay } = this.dayBounds();

        const todays = await this.prisma.attendance.findMany({
            where: {
                userId,
                taskId: data.taskId,
                timestamp: { gte: startOfDay, lte: endOfDay },
            },
            orderBy: { timestamp: 'asc' },
        });

        if (todays.length === 0) {
            throw new BadRequestException('Clock in before clocking out.');
        }
        const last = todays[todays.length - 1];
        if (last.type === 'CLOCK_OUT') {
            throw new ConflictException('You have already clocked out for this task today.');
        }
        if (last.type !== 'CLOCK_IN') {
            throw new BadRequestException('Invalid attendance sequence for today.');
        }

        return this.prisma.attendance.create({
            data: {
                userId,
                taskId: data.taskId,
                type: 'CLOCK_OUT',
                lat: data.lat,
                lng: data.lng,
                accuracyMeters: data.accuracyMeters,
                deviceId: data.deviceId,
                uniqueRequestId: data.uniqueRequestId,
                imageHash: data.imageHash,
                imageUrl: data.imageUrl,
                syncStatus: SyncStatus.SYNCED,
            },
        });
    }

    async getMyAttendances(userId: string) {
        return this.prisma.attendance.findMany({
            where: { userId },
            include: { task: true },
            orderBy: { timestamp: 'desc' }
        });
    }

    async getAllAttendances() {
        return this.prisma.attendance.findMany({
            include: {
                user: { select: { firstName: true, lastName: true, role: true } },
                task: { select: { title: true, zoneName: true } }
            },
            orderBy: { timestamp: 'desc' }
        });
    }
}
