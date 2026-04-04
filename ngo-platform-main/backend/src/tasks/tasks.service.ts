import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role, Task, TaskAssignment, TaskTemplate } from '@prisma/client';

const TASK_DETAIL_PRIVILEGED_ROLES: Role[] = [
    Role.SUPER_ADMIN,
    Role.NGO_ADMIN,
    Role.FIELD_COORDINATOR,
    Role.HR_MANAGER,
    Role.FINANCE_MANAGER,
];

export interface TaskListQuery {
    page?: number;
    limit?: number;
    search?: string;
    template?: TaskTemplate;
    isActive?: boolean;
}

@Injectable()
export class TasksService {
    constructor(private prisma: PrismaService) { }

    private assertEndAfterStart(start: Date, end: Date): void {
        if (end.getTime() <= start.getTime()) {
            throw new BadRequestException('endTime must be after startTime');
        }
    }

    private static readonly GEOFENCE_ERR = 'Invalid task geofence:';

    /** Rejects non-finite numbers (avoids NaN from Number(undefined)). */
    private requireFiniteCreateScalar(value: unknown, label: string): number {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        throw new BadRequestException(
            `${TasksService.GEOFENCE_ERR} ${label} must be a finite number.`,
        );
    }

    private assertValidGeofence(lat: number, lng: number, radius: number): void {
        const p = TasksService.GEOFENCE_ERR;
        if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
            throw new BadRequestException(
                `${p} latitude out of range (allowed -90 to 90, inclusive).`,
            );
        }
        if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
            throw new BadRequestException(
                `${p} longitude out of range (allowed -180 to 180, inclusive).`,
            );
        }
        if (!Number.isFinite(radius) || radius <= 0) {
            throw new BadRequestException(`${p} radius must be greater than 0.`);
        }
    }

    private effectiveFloatFromUpdatePatch(
        patch: Prisma.TaskUpdateInput['geofenceLat'],
        current: number,
    ): number {
        if (patch === undefined || patch === null) {
            return current;
        }
        if (typeof patch === 'number') {
            return patch;
        }
        if (typeof patch === 'object' && patch !== null && 'set' in patch) {
            const v = (patch as { set: number }).set;
            return typeof v === 'number' ? v : current;
        }
        return current;
    }

    private toDate(value: Date | string): Date {
        return value instanceof Date ? value : new Date(value);
    }

    private effectiveDateFromUpdatePatch(
        patch: Prisma.TaskUpdateInput['startTime'] | Prisma.TaskUpdateInput['endTime'],
        current: Date,
    ): Date {
        if (patch === undefined || patch === null) {
            return current;
        }
        if (patch instanceof Date) {
            return patch;
        }
        if (typeof patch === 'string') {
            return new Date(patch);
        }
        if (typeof patch === 'object' && patch !== null && 'set' in patch) {
            const s = (patch as { set: Date | string }).set;
            return s instanceof Date ? s : new Date(s);
        }
        return current;
    }

    async create(data: Prisma.TaskCreateInput): Promise<Task> {
        const start = this.toDate(data.startTime as Date | string);
        const end = this.toDate(data.endTime as Date | string);
        this.assertEndAfterStart(start, end);
        this.assertValidGeofence(
            this.requireFiniteCreateScalar(data.geofenceLat, 'latitude (geofenceLat)'),
            this.requireFiniteCreateScalar(data.geofenceLng, 'longitude (geofenceLng)'),
            this.requireFiniteCreateScalar(data.geofenceRadius, 'radius (geofenceRadius)'),
        );
        return this.prisma.task.create({ data });
    }

    async findAll(query: TaskListQuery = {}): Promise<Task[]> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        return this.prisma.task.findMany({
            where: {
                template: query.template,
                isActive: query.isActive,
                OR: query.search
                    ? [
                        { title: { contains: query.search, mode: 'insensitive' } },
                        { zoneName: { contains: query.search, mode: 'insensitive' } },
                    ]
                    : undefined,
            },
            include: {
                _count: { select: { assignments: true, reports: true } }
            },
            orderBy: { startTime: 'desc' },
            skip,
            take: limit,
        });
    }

    async findOne(id: string): Promise<Task> {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: { assignments: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } } } }
        });
        if (!task) throw new NotFoundException('Task not found');
        return task;
    }

    /** Task detail: privileged roles see all tasks; others only if assigned. */
    async findOneForRequester(id: string, requesterId: string, requesterRole: Role): Promise<Task> {
        if (TASK_DETAIL_PRIVILEGED_ROLES.includes(requesterRole)) {
            return this.findOne(id);
        }
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: { assignments: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } } } }
        });
        if (!task) throw new NotFoundException('Task not found');
        const isAssigned = task.assignments.some((a) => a.userId === requesterId);
        if (!isAssigned) {
            throw new ForbiddenException('Task not found or access denied');
        }
        return task;
    }

    /**
     * Assigned tasks overlapping the current calendar day in the server host local timezone.
     * Multi-region accurate "today" would need an explicit timezone or user locale (not implemented).
     */
    async findAssignedToUser(userId: string): Promise<Task[]> {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const assignments = await this.prisma.taskAssignment.findMany({
            where: {
                userId,
                task: {
                    isActive: true,
                    startTime: { lte: endOfDay },
                    endTime: { gte: startOfDay },
                },
            },
            include: { task: true },
            orderBy: { task: { startTime: 'asc' } },
        });
        return assignments.map((a) => a.task);
    }

    async assertUserAssignedToTask(userId: string, taskId: string): Promise<void> {
        const assignment = await this.prisma.taskAssignment.findUnique({
            where: { userId_taskId: { userId, taskId } },
        });
        if (!assignment) {
            throw new ForbiddenException('You are not assigned to this task');
        }
    }

    async assignUserToTask(taskId: string, userId: string): Promise<TaskAssignment> {
        await this.findOne(taskId);

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const existing = await this.prisma.taskAssignment.findUnique({
            where: { userId_taskId: { userId, taskId } },
        });
        if (existing) {
            throw new ConflictException('User is already assigned to this task');
        }

        try {
            return await this.prisma.taskAssignment.create({
                data: {
                    taskId,
                    userId,
                },
            });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                throw new ConflictException('User is already assigned to this task');
            }
            throw e;
        }
    }

    async removeUserFromTask(taskId: string, userId: string): Promise<void> {
        try {
            await this.prisma.taskAssignment.delete({
                where: { userId_taskId: { userId, taskId } }
            });
        } catch (e) {
            throw new NotFoundException('Assignment not found');
        }
    }

    async update(id: string, data: Prisma.TaskUpdateInput): Promise<Task> {
        const existing = await this.findOne(id);
        const start = this.effectiveDateFromUpdatePatch(data.startTime, existing.startTime);
        const end = this.effectiveDateFromUpdatePatch(data.endTime, existing.endTime);
        this.assertEndAfterStart(start, end);
        const lat = this.effectiveFloatFromUpdatePatch(data.geofenceLat, existing.geofenceLat);
        const lng = this.effectiveFloatFromUpdatePatch(data.geofenceLng, existing.geofenceLng);
        const radius = this.effectiveFloatFromUpdatePatch(data.geofenceRadius, existing.geofenceRadius);
        this.assertValidGeofence(lat, lng, radius);
        return this.prisma.task.update({ where: { id }, data });
    }

    async remove(id: string): Promise<Task> {
        await this.findOne(id);
        return this.prisma.task.delete({ where: { id } });
    }
}
