"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tasks_service_1 = require("../tasks/tasks.service");
const geo_util_1 = require("../utils/geo.util");
const client_1 = require("@prisma/client");
let AttendanceService = class AttendanceService {
    prisma;
    tasksService;
    constructor(prisma, tasksService) {
        this.prisma = prisma;
        this.tasksService = tasksService;
    }
    dayBounds() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return { now, startOfDay, endOfDay };
    }
    async validateTaskWindowAndGeofence(userId, role, taskId, data) {
        await this.tasksService.assertUserAssignedToTask(userId, taskId);
        const task = await this.tasksService.findOneForRequester(taskId, userId, role);
        const { now } = this.dayBounds();
        if (now < task.startTime || now > task.endTime) {
            throw new common_1.BadRequestException('Task is not currently active');
        }
        const distance = (0, geo_util_1.getDistanceFromLatLonInMeters)(data.lat, data.lng, task.geofenceLat, task.geofenceLng);
        const buffer = data.accuracyMeters > 0 ? data.accuracyMeters : 20;
        if (distance > task.geofenceRadius + buffer) {
            throw new common_1.BadRequestException(`Geofence violation. You are ${Math.round(distance)}m away from task zone, max allowed is ${task.geofenceRadius}m.`);
        }
        return task;
    }
    async clockIn(userId, role, data) {
        const existingReq = await this.prisma.attendance.findUnique({
            where: { uniqueRequestId: data.uniqueRequestId },
        });
        if (existingReq)
            return existingReq;
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
            throw new common_1.ConflictException('You have already clocked in for this task today.');
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
                syncStatus: client_1.SyncStatus.SYNCED,
            },
        });
    }
    async clockOut(userId, role, data) {
        const existingReq = await this.prisma.attendance.findUnique({
            where: { uniqueRequestId: data.uniqueRequestId },
        });
        if (existingReq)
            return existingReq;
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
            throw new common_1.BadRequestException('Clock in before clocking out.');
        }
        const last = todays[todays.length - 1];
        if (last.type === 'CLOCK_OUT') {
            throw new common_1.ConflictException('You have already clocked out for this task today.');
        }
        if (last.type !== 'CLOCK_IN') {
            throw new common_1.BadRequestException('Invalid attendance sequence for today.');
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
                syncStatus: client_1.SyncStatus.SYNCED,
            },
        });
    }
    async getMyAttendances(userId) {
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
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tasks_service_1.TasksService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map