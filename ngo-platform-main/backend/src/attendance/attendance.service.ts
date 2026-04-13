import {
    Injectable,
    BadRequestException,
    ConflictException,
    Logger,
    NotFoundException,
    Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { getDistanceFromLatLonInMeters } from '../utils/geo.util';
import { Role, SyncStatus } from '@prisma/client';
import type { ClockInDto } from './dto/clock-in.dto';
import { VolunteerCacheService } from '../volunteer/volunteer-cache.service';

/** Extra slack for GPS error + slight clock skew for field check-ins */
const ATTENDANCE_TIME_GRACE_MS = 60 * 60 * 1000;

@Injectable()
export class AttendanceService {
    private readonly logger = new Logger(AttendanceService.name);

    constructor(
        private prisma: PrismaService,
        private tasksService: TasksService,
        @Optional() private readonly volunteerCache?: VolunteerCacheService,
    ) { }

    /**
     * Replays recent attendance to enforce at most one open CLOCK_IN globally per user.
     * OUT only closes when it matches the task that is currently open.
     */
    private async findGloballyOpenTaskId(userId: string): Promise<string | null> {
        const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const rows = await this.prisma.attendance.findMany({
            where: { userId, timestamp: { gte: since } },
            orderBy: { timestamp: 'asc' },
            select: { taskId: true, type: true },
            take: 5000,
        });
        let open: string | null = null;
        for (const r of rows) {
            if (!r.taskId) continue;
            if (r.type === 'CLOCK_IN') {
                open = r.taskId;
            } else if (r.type === 'CLOCK_OUT') {
                if (open !== null && r.taskId === open) {
                    open = null;
                }
            }
        }
        return open;
    }

    private async invalidateVolunteerDashboard(userId: string): Promise<void> {
        await this.volunteerCache?.invalidateForUser(userId);
    }

    private dayBounds() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return { now, startOfDay, endOfDay };
    }

    private async validateTaskWindowAndGeofence(
        userId: string,
        role: Role,
        organizationId: string,
        taskId: string,
        data: ClockInDto,
    ) {
        await this.tasksService.assertUserAssignedToTask(userId, taskId);
        const task = await this.tasksService.findOneForRequester(taskId, userId, role, organizationId);
        const { now } = this.dayBounds();
        const startOk = new Date(task.startTime.getTime() - ATTENDANCE_TIME_GRACE_MS);
        const endOk = new Date(task.endTime.getTime() + ATTENDANCE_TIME_GRACE_MS);
        if (now < startOk || now > endOk) {
            this.logger.warn(
                `clock window reject userId=${userId} taskId=${taskId} now=${now.toISOString()} start=${task.startTime.toISOString()} end=${task.endTime.toISOString()}`,
            );
            throw new BadRequestException('Task is not currently active');
        }
        const distance = getDistanceFromLatLonInMeters(data.lat, data.lng, task.geofenceLat, task.geofenceLng);
        const reported =
            typeof data.accuracyMeters === 'number' && Number.isFinite(data.accuracyMeters) && data.accuracyMeters >= 0
                ? data.accuracyMeters
                : 45;
        const buffer = Math.min(250, Math.max(25, reported));
        const allowed = task.geofenceRadius + buffer;
        if (distance > allowed) {
            this.logger.warn(
                `clock geofence reject userId=${userId} taskId=${taskId} distanceM=${Math.round(distance)} allowedM=${Math.round(allowed)} radius=${task.geofenceRadius} buffer=${Math.round(buffer)}`,
            );
            throw new BadRequestException(
                `Geofence violation. You are ${Math.round(distance)}m away from task zone, max allowed is ${task.geofenceRadius}m.`,
            );
        }
        return task;
    }

    async clockIn(userId: string, role: Role, organizationId: string, data: ClockInDto) {
        const existingReq = await this.prisma.attendance.findUnique({
            where: { uniqueRequestId: data.uniqueRequestId },
        });
        if (existingReq) return existingReq;

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
            throw new ConflictException('You have already clocked in for this task today.');
        }

        const globalOpen = await this.findGloballyOpenTaskId(userId);
        if (globalOpen !== null && globalOpen !== data.taskId) {
            throw new ConflictException({
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
                syncStatus: SyncStatus.SYNCED,
            },
        });
        await this.invalidateVolunteerDashboard(userId);
        return created;
    }

    async clockOut(userId: string, role: Role, organizationId: string, data: ClockInDto) {
        const existingReq = await this.prisma.attendance.findUnique({
            where: { uniqueRequestId: data.uniqueRequestId },
        });
        if (existingReq) return existingReq;

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
            throw new BadRequestException('Clock in before clocking out.');
        }
        const last = todays[todays.length - 1];
        if (last.type === 'CLOCK_OUT') {
            throw new ConflictException('You have already clocked out for this task today.');
        }
        if (last.type !== 'CLOCK_IN') {
            throw new BadRequestException('Invalid attendance sequence for today.');
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
                syncStatus: SyncStatus.SYNCED,
            },
        });
        await this.invalidateVolunteerDashboard(userId);
        return created;
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

    /**
     * Per-volunteer attendance for a task today (clock-in/out and live presence).
     */
    async listAttendanceForTask(taskId: string, organizationId: string, actorId: string, role: Role) {
        const task = await this.tasksService.findOneInOrganization(taskId, organizationId);
        this.tasksService.assertActorCanViewTaskAttendance(task, actorId, role);

        const volunteerAssignments = task.assignments.filter((a) => a.user.role === Role.VOLUNTEER);
        const { startOfDay, endOfDay } = this.dayBounds();

        const attendRows = await this.prisma.attendance.findMany({
            where: { taskId, timestamp: { gte: startOfDay, lte: endOfDay } },
            orderBy: { timestamp: 'asc' },
        });

        return volunteerAssignments.map(({ userId, user }) => {
            const evts = attendRows.filter((r) => r.userId === userId);
            let clockIn: Date | null = null;
            let clockOut: Date | null = null;
            let open = false;
            for (const e of evts) {
                if (e.type === 'CLOCK_IN') {
                    clockIn = e.timestamp;
                    open = true;
                } else if (e.type === 'CLOCK_OUT' && open) {
                    clockOut = e.timestamp;
                    open = false;
                }
            }
            const name = `${user.firstName} ${user.lastName}`.trim();
            const status: 'PRESENT' | 'NOT_CHECKED_IN' | 'CHECKED_OUT' = open
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

    /** Recent clock-ins for team leader / coordinator dashboards. */
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

    /** Audit stub — extend with persistence when compliance rules are defined. */
    async recordAttendanceOverride(
        _actorId: string,
        body: { attendanceId: string; reason: string; action: string },
    ) {
        return { success: true, attendanceId: body.attendanceId, action: body.action };
    }
}
