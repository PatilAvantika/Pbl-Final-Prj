import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { getDistanceFromLatLonInMeters } from '../utils/geo.util';
import { SyncStatus } from '@prisma/client';

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

    async clockIn(userId: string, data: ClockInDto) {
        // 1. Check idempotency
        const existingReq = await this.prisma.attendance.findUnique({
            where: { uniqueRequestId: data.uniqueRequestId }
        });
        if (existingReq) return existingReq;

        // 2. Fetch Task and validate geofence
        const task = await this.tasksService.findOne(data.taskId);

        // Are they currently active on this task?
        const now = new Date();
        if (now < task.startTime || now > task.endTime) {
            throw new BadRequestException('Task is not currently active');
        }

        const distance = getDistanceFromLatLonInMeters(
            data.lat, data.lng,
            task.geofenceLat, task.geofenceLng
        );

        // Allowing some buffer for GPS accuracy
        const buffer = data.accuracyMeters > 0 ? data.accuracyMeters : 20;
        if (distance > (task.geofenceRadius + buffer)) {
            throw new BadRequestException(`Geofence violation. You are ${Math.round(distance)}m away from task zone, max allowed is ${task.geofenceRadius}m.`);
        }

        // 3. Duplicate detection for photo hash & existing shift
        // Check if they already clocked in today for this task

        // Assuming simple validation: count attendances for user & task today
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        const existingClockIn = await this.prisma.attendance.findFirst({
            where: {
                userId,
                taskId: data.taskId,
                type: 'CLOCK_IN',
                timestamp: { gte: startOfDay, lte: endOfDay }
            }
        });

        if (existingClockIn) {
            throw new ConflictException('You have already clocked in for this task today.');
        }

        // Insert ClockIn
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
                syncStatus: SyncStatus.SYNCED
            }
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
        })
    }
}
