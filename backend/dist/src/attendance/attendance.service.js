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
exports.AttendanceService = exports.ClockInDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tasks_service_1 = require("../tasks/tasks.service");
const geo_util_1 = require("../utils/geo.util");
const client_1 = require("@prisma/client");
class ClockInDto {
    taskId;
    lat;
    lng;
    accuracyMeters;
    uniqueRequestId;
    deviceId;
    imageHash;
    imageUrl;
}
exports.ClockInDto = ClockInDto;
let AttendanceService = class AttendanceService {
    prisma;
    tasksService;
    constructor(prisma, tasksService) {
        this.prisma = prisma;
        this.tasksService = tasksService;
    }
    async clockIn(userId, data) {
        const existingReq = await this.prisma.attendance.findUnique({
            where: { uniqueRequestId: data.uniqueRequestId }
        });
        if (existingReq)
            return existingReq;
        const task = await this.tasksService.findOne(data.taskId);
        const now = new Date();
        if (now < task.startTime || now > task.endTime) {
            throw new common_1.BadRequestException('Task is not currently active');
        }
        const distance = (0, geo_util_1.getDistanceFromLatLonInMeters)(data.lat, data.lng, task.geofenceLat, task.geofenceLng);
        const buffer = data.accuracyMeters > 0 ? data.accuracyMeters : 20;
        if (distance > (task.geofenceRadius + buffer)) {
            throw new common_1.BadRequestException(`Geofence violation. You are ${Math.round(distance)}m away from task zone, max allowed is ${task.geofenceRadius}m.`);
        }
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
                syncStatus: client_1.SyncStatus.SYNCED
            }
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