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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AttendanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tasks_service_1 = require("../tasks/tasks.service");
const geo_util_1 = require("../utils/geo.util");
const client_1 = require("@prisma/client");
const volunteer_cache_service_1 = require("../volunteer/volunteer-cache.service");
const ATTENDANCE_TIME_GRACE_MS = 60 * 60 * 1000;
let AttendanceService = AttendanceService_1 = class AttendanceService {
    prisma;
    tasksService;
    volunteerCache;
    logger = new common_1.Logger(AttendanceService_1.name);
    constructor(prisma, tasksService, volunteerCache) {
        this.prisma = prisma;
        this.tasksService = tasksService;
        this.volunteerCache = volunteerCache;
    }
    async findGloballyOpenTaskId(userId) {
        const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const rows = await this.prisma.attendance.findMany({
            where: { userId, timestamp: { gte: since } },
            orderBy: { timestamp: 'asc' },
            select: { taskId: true, type: true },
            take: 5000,
        });
        let open = null;
        for (const r of rows) {
            if (!r.taskId)
                continue;
            if (r.type === 'CLOCK_IN') {
                open = r.taskId;
            }
            else if (r.type === 'CLOCK_OUT') {
                if (open !== null && r.taskId === open) {
                    open = null;
                }
            }
        }
        return open;
    }
    async invalidateVolunteerDashboard(userId) {
        await this.volunteerCache?.invalidateForUser(userId);
    }
    dayBounds() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return { now, startOfDay, endOfDay };
    }
    async validateTaskWindowAndGeofence(userId, role, organizationId, taskId, data) {
        await this.tasksService.assertUserAssignedToTask(userId, taskId);
        const task = await this.tasksService.findOneForRequester(taskId, userId, role, organizationId);
        const { now } = this.dayBounds();
        const startOk = new Date(task.startTime.getTime() - ATTENDANCE_TIME_GRACE_MS);
        const endOk = new Date(task.endTime.getTime() + ATTENDANCE_TIME_GRACE_MS);
        if (now < startOk || now > endOk) {
            this.logger.warn(`clock window reject userId=${userId} taskId=${taskId} now=${now.toISOString()} start=${task.startTime.toISOString()} end=${task.endTime.toISOString()}`);
            throw new common_1.BadRequestException('Task is not currently active');
        }
        const distance = (0, geo_util_1.getDistanceFromLatLonInMeters)(data.lat, data.lng, task.geofenceLat, task.geofenceLng);
        const reported = typeof data.accuracyMeters === 'number' && Number.isFinite(data.accuracyMeters) && data.accuracyMeters >= 0
            ? data.accuracyMeters
            : 45;
        const buffer = Math.min(250, Math.max(25, reported));
        const allowed = task.geofenceRadius + buffer;
        if (distance > allowed) {
            this.logger.warn(`clock geofence reject userId=${userId} taskId=${taskId} distanceM=${Math.round(distance)} allowedM=${Math.round(allowed)} radius=${task.geofenceRadius} buffer=${Math.round(buffer)}`);
            throw new common_1.BadRequestException(`Geofence violation. You are ${Math.round(distance)}m away from task zone, max allowed is ${task.geofenceRadius}m.`);
        }
        return task;
    }
    async clockIn(userId, role, organizationId, data) {
        const existingReq = await this.prisma.attendance.findUnique({
            where: { uniqueRequestId: data.uniqueRequestId },
        });
        if (existingReq)
            return existingReq;
        await this.validateTaskWindowAndGeofence(userId, role, organizationId, data.taskId, data);
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
        const globalOpen = await this.findGloballyOpenTaskId(userId);
        if (globalOpen !== null && globalOpen !== data.taskId) {
            throw new common_1.ConflictException({
                code: 'ATTENDANCE_SESSION_ACTIVE_ELSEWHERE',
                message: 'You already have an active clock-in on another task. Clock out there first.',
            });
        }
        const created = await this.prisma.attendance.create({
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
        await this.invalidateVolunteerDashboard(userId);
        return created;
    }
    async clockOut(userId, role, organizationId, data) {
        const existingReq = await this.prisma.attendance.findUnique({
            where: { uniqueRequestId: data.uniqueRequestId },
        });
        if (existingReq)
            return existingReq;
        await this.validateTaskWindowAndGeofence(userId, role, organizationId, data.taskId, data);
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
        const created = await this.prisma.attendance.create({
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
        await this.invalidateVolunteerDashboard(userId);
        return created;
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
    async listAttendanceForTask(taskId, organizationId, actorId, role) {
        const task = await this.tasksService.findOneInOrganization(taskId, organizationId);
        this.tasksService.assertActorCanViewTaskAttendance(task, actorId, role);
        const volunteerAssignments = task.assignments.filter((a) => a.user.role === client_1.Role.VOLUNTEER);
        const { startOfDay, endOfDay } = this.dayBounds();
        const attendRows = await this.prisma.attendance.findMany({
            where: { taskId, timestamp: { gte: startOfDay, lte: endOfDay } },
            orderBy: { timestamp: 'asc' },
        });
        return volunteerAssignments.map(({ userId, user }) => {
            const evts = attendRows.filter((r) => r.userId === userId);
            let clockIn = null;
            let clockOut = null;
            let open = false;
            for (const e of evts) {
                if (e.type === 'CLOCK_IN') {
                    clockIn = e.timestamp;
                    open = true;
                }
                else if (e.type === 'CLOCK_OUT' && open) {
                    clockOut = e.timestamp;
                    open = false;
                }
            }
            const name = `${user.firstName} ${user.lastName}`.trim();
            const status = open
                ? 'PRESENT'
                : !clockIn
                    ? 'NOT_CHECKED_IN'
                    : 'CHECKED_OUT';
            return {
                userId,
                name,
                clockInAt: clockIn ? clockIn.toISOString() : null,
                clockOutAt: clockOut ? clockOut.toISOString() : null,
                status,
            };
        });
    }
    async listTeamLive() {
        const rows = await this.prisma.attendance.findMany({
            where: { type: 'CLOCK_IN' },
            orderBy: { timestamp: 'desc' },
            take: 300,
            include: {
                user: { select: { id: true, firstName: true, lastName: true, role: true } },
            },
        });
        return rows.map((a) => ({
            id: a.id,
            volunteerId: a.userId,
            name: `${a.user.firstName} ${a.user.lastName}`.trim(),
            checkInAt: a.timestamp.toISOString(),
            gpsOk: a.accuracyMeters < 400,
            faceVerified: Boolean(a.imageUrl),
            suspicious: a.accuracyMeters >= 250,
        }));
    }
    async recordAttendanceOverride(_actorId, body) {
        return { success: true, attendanceId: body.attendanceId, action: body.action };
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = AttendanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tasks_service_1.TasksService,
        volunteer_cache_service_1.VolunteerCacheService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map