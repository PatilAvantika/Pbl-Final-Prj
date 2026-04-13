import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role, Task, TaskAssignment, TaskLifecycleStatus, TaskTemplate } from '@prisma/client';
import { TaskAssignmentOrchestratorService } from '../field-ops/services/task-assignment-orchestrator.service';
import { TaskLifecycleService } from '../field-ops/services/task-lifecycle.service';
import type { AssignmentMode } from '../field-ops/domain/task-assignment/assignment-strategy.interface';
import type { PatchTaskDto } from './dto/patch-task.dto';

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
    organizationId: string;
}

const ASSIGN_PATCH_ROLES: Role[] = [
    Role.SUPER_ADMIN,
    Role.NGO_ADMIN,
    Role.FIELD_COORDINATOR,
    Role.TEAM_LEADER,
];

export type TaskWithAssignments = Task & {
    teamLeaderId: string | null;
    assignments: { userId: string; user: { firstName: string; lastName: string; role: Role } }[];
};

@Injectable()
export class TasksService {
    constructor(
        private prisma: PrismaService,
        private readonly assignmentOrchestrator: TaskAssignmentOrchestratorService,
        private readonly taskLifecycle: TaskLifecycleService,
    ) {}

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

    async findAll(query: TaskListQuery): Promise<Task[]> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        return this.prisma.task.findMany({
            where: {
                organizationId: query.organizationId,
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

    async findOneInOrganization(id: string, organizationId: string): Promise<TaskWithAssignments> {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId },
            include: { assignments: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } } } }
        });
        if (!task) throw new NotFoundException('Task not found');
        return task;
    }

    /** Team leaders may manage tasks they lead (`teamLeaderId`) or legacy tasks they are assigned to. */
    assertTeamLeaderOwnsTask(task: TaskWithAssignments, actorId: string): void {
        if (task.teamLeaderId) {
            if (task.teamLeaderId !== actorId) {
                throw new ForbiddenException('You can only manage tasks you lead');
            }
            return;
        }
        const assigned = task.assignments.some((a) => a.userId === actorId);
        if (!assigned) {
            throw new ForbiddenException('You can only manage tasks you lead');
        }
    }

    private assertActorCanManageTaskAssignments(task: TaskWithAssignments, actor?: { id: string; role: Role }): void {
        if (!actor) return;
        const privileged: Role[] = [Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR];
        if (privileged.includes(actor.role)) return;
        if (actor.role === Role.TEAM_LEADER) {
            this.assertTeamLeaderOwnsTask(task, actor.id);
            return;
        }
        throw new ForbiddenException('Not allowed to modify task assignments');
    }

    supervisorRolesForTaskAttendance(): Role[] {
        return [Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.HR_MANAGER];
    }

    assertActorCanViewTaskAttendance(
        task: TaskWithAssignments,
        actorId: string,
        role: Role,
    ): void {
        if (this.supervisorRolesForTaskAttendance().includes(role)) return;
        if (role === Role.TEAM_LEADER) {
            this.assertTeamLeaderOwnsTask(task, actorId);
            return;
        }
        throw new ForbiddenException('Not allowed to view attendance for this task');
    }

    /**
     * Report review: designated `teamLeaderId` must match; if the task has no leader set, any org team leader may review.
     */
    async assertTeamLeaderOfTask(taskId: string, organizationId: string, teamLeaderId: string): Promise<void> {
        const task = (await this.prisma.task.findFirst({
            where: { id: taskId, organizationId },
            include: { assignments: true },
        })) as TaskWithAssignments | null;
        if (!task) throw new NotFoundException('Task not found');
        if (task.teamLeaderId != null && task.teamLeaderId !== teamLeaderId) {
            throw new ForbiddenException('You can only review reports for tasks you lead');
        }
    }

    /**
     * Tasks created by or assigned to this team leader, with assignment and count metadata.
     */
    async findTasksForTeamLeader(userId: string, organizationId: string) {
        return this.prisma.task.findMany({
            where: {
                organizationId,
                OR: [{ teamLeaderId: userId }, { teamLeaderId: null, assignments: { some: { userId } } }],
            },
            include: {
                assignments: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, role: true, email: true } },
                    },
                },
                _count: { select: { attendances: true, reports: true } },
            },
            orderBy: { startTime: 'desc' },
        });
    }

    /** Task detail: privileged roles see tasks in their org; others only if assigned. */
    async findOneForRequester(
        id: string,
        requesterId: string,
        requesterRole: Role,
        organizationId: string,
    ): Promise<Task> {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId },
            include: { assignments: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } } } }
        });
        if (!task) throw new NotFoundException('Task not found');
        if (TASK_DETAIL_PRIVILEGED_ROLES.includes(requesterRole)) {
            return task as TaskWithAssignments;
        }
        if (requesterRole === Role.TEAM_LEADER && task.teamLeaderId === requesterId) {
            return task as TaskWithAssignments;
        }
        const isAssigned = task.assignments.some((a) => a.userId === requesterId);
        if (!isAssigned) {
            throw new ForbiddenException('Task not found or access denied');
        }
        return task as TaskWithAssignments;
    }

    /**
     * All tasks assigned to the user in this org (including completed / isActive false).
     * Volunteer UIs filter by lifecycle locally; hiding inactive tasks made assignments disappear after completion or admin toggle.
     */
    async findAssignedToUser(userId: string, organizationId: string): Promise<Task[]> {
        return this.prisma.task.findMany({
            where: {
                organizationId,
                assignments: { some: { userId } },
            },
            orderBy: { startTime: 'desc' },
        });
    }

    async assertUserAssignedToTask(userId: string, taskId: string): Promise<void> {
        const assignment = await this.prisma.taskAssignment.findUnique({
            where: { userId_taskId: { userId, taskId } },
        });
        if (!assignment) {
            throw new ForbiddenException('You are not assigned to this task');
        }
    }

    async assignUserToTask(
        taskId: string,
        userId: string,
        organizationId: string,
        actor?: { id: string; role: Role },
    ): Promise<TaskAssignment> {
        const task = await this.findOneInOrganization(taskId, organizationId);
        this.assertActorCanManageTaskAssignments(task, actor);

        const user = await this.prisma.user.findFirst({
            where: { id: userId, organizationId },
            select: { id: true, role: true },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (user.role !== Role.VOLUNTEER) {
            throw new BadRequestException('Only users with role VOLUNTEER can be assigned to field tasks');
        }

        const existing = await this.prisma.taskAssignment.findUnique({
            where: { userId_taskId: { userId, taskId } },
        });
        if (existing) {
            throw new ConflictException('User is already assigned to this task');
        }

        try {
            const created = await this.prisma.taskAssignment.create({
                data: {
                    taskId,
                    userId,
                },
            });
            return created;
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                throw new ConflictException('User is already assigned to this task');
            }
            throw e;
        }
    }

    async removeUserFromTask(
        taskId: string,
        userId: string,
        organizationId: string,
        actor?: { id: string; role: Role },
    ): Promise<void> {
        const task = await this.findOneInOrganization(taskId, organizationId);
        this.assertActorCanManageTaskAssignments(task, actor);
        try {
            await this.prisma.taskAssignment.delete({
                where: { userId_taskId: { userId, taskId } }
            });
        } catch (e) {
            throw new NotFoundException('Assignment not found');
        }
    }

    async update(id: string, organizationId: string, data: Prisma.TaskUpdateInput): Promise<Task> {
        const existing = await this.findOneInOrganization(id, organizationId);
        const start = this.effectiveDateFromUpdatePatch(data.startTime, existing.startTime);
        const end = this.effectiveDateFromUpdatePatch(data.endTime, existing.endTime);
        this.assertEndAfterStart(start, end);
        const lat = this.effectiveFloatFromUpdatePatch(data.geofenceLat, existing.geofenceLat);
        const lng = this.effectiveFloatFromUpdatePatch(data.geofenceLng, existing.geofenceLng);
        const radius = this.effectiveFloatFromUpdatePatch(data.geofenceRadius, existing.geofenceRadius);
        this.assertValidGeofence(lat, lng, radius);
        return this.prisma.task.update({ where: { id }, data });
    }

    async remove(id: string, organizationId: string): Promise<Task> {
        await this.findOneInOrganization(id, organizationId);
        return this.prisma.task.delete({ where: { id } });
    }

    private mapLegacyUiStatus(s?: string): TaskLifecycleStatus | undefined {
        if (!s) return undefined;
        const u = s.toUpperCase();
        if (u === 'IN_PROGRESS') return TaskLifecycleStatus.ACTIVE;
        if (u === 'PENDING') return TaskLifecycleStatus.PENDING;
        if (u === 'ACTIVE') return TaskLifecycleStatus.ACTIVE;
        if (u === 'COMPLETED') return TaskLifecycleStatus.COMPLETED;
        if (u === 'CANCELLED') return TaskLifecycleStatus.CANCELLED;
        return undefined;
    }

    async assignWithStrategy(
        taskId: string,
        organizationId: string,
        actorId: string,
        role: Role,
        mode: AssignmentMode,
        userIds?: string[],
    ) {
        if (!ASSIGN_PATCH_ROLES.includes(role)) {
            throw new ForbiddenException('Not allowed to run assignment strategy');
        }
        const task = await this.findOneInOrganization(taskId, organizationId);
        if (role === Role.TEAM_LEADER) {
            this.assertTeamLeaderOwnsTask(task, actorId);
        }
        return this.assignmentOrchestrator.assign(mode, {
            taskId,
            leaderId: actorId,
            organizationId,
            userIds,
        });
    }

    private patchDtoToPrismaUpdate(dto: PatchTaskDto): Prisma.TaskUpdateInput {
        const keys = [
            'title',
            'description',
            'template',
            'zoneName',
            'geofenceLat',
            'geofenceLng',
            'geofenceRadius',
            'startTime',
            'endTime',
            'isActive',
        ] as const;
        const out: Prisma.TaskUpdateInput = {};
        for (const k of keys) {
            const v = dto[k];
            if (v !== undefined) {
                (out as Record<string, unknown>)[k] = v;
            }
        }
        return out;
    }

    /**
     * PATCH semantics for team-leader UI: optional lifecycle (or legacy `status`),
     * optional `assigneeIds` (empty = open task), plus partial task fields.
     */
    async patchTeamLeader(
        id: string,
        organizationId: string,
        actorId: string,
        role: Role,
        dto: PatchTaskDto,
    ): Promise<Task> {
        let task = await this.findOneInOrganization(id, organizationId);

        if (role === Role.TEAM_LEADER) {
            this.assertTeamLeaderOwnsTask(task, actorId);
        }

        const { lifecycleStatus, status, assigneeIds } = dto;

        if (assigneeIds !== undefined) {
            if (!ASSIGN_PATCH_ROLES.includes(role)) {
                throw new ForbiddenException('Not allowed to change assignments');
            }
            if (assigneeIds.length === 0) {
                await this.assignmentOrchestrator.assign('open', {
                    taskId: id,
                    leaderId: actorId,
                    organizationId,
                });
            } else {
                await this.assignmentOrchestrator.assign('bulk', {
                    taskId: id,
                    leaderId: actorId,
                    organizationId,
                    userIds: assigneeIds,
                });
            }
            task = await this.findOneInOrganization(id, organizationId);
        }

        const targetLifecycle = lifecycleStatus ?? this.mapLegacyUiStatus(status);
        if (targetLifecycle !== undefined) {
            await this.taskLifecycle.applyTransition(task, targetLifecycle);
        }

        const rest = this.patchDtoToPrismaUpdate(dto);
        if (Object.keys(rest).length > 0) {
            return this.update(id, organizationId, rest);
        }
        return this.findOneInOrganization(id, organizationId);
    }
}
