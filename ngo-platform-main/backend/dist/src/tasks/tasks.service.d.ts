import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role, Task, TaskAssignment, TaskTemplate } from '@prisma/client';
import { TaskAssignmentOrchestratorService } from '../field-ops/services/task-assignment-orchestrator.service';
import { TaskLifecycleService } from '../field-ops/services/task-lifecycle.service';
import type { AssignmentMode } from '../field-ops/domain/task-assignment/assignment-strategy.interface';
import type { PatchTaskDto } from './dto/patch-task.dto';
export interface TaskListQuery {
    page?: number;
    limit?: number;
    search?: string;
    template?: TaskTemplate;
    isActive?: boolean;
    organizationId: string;
}
export type TaskWithAssignments = Task & {
    teamLeaderId: string | null;
    assignments: {
        userId: string;
        user: {
            firstName: string;
            lastName: string;
            role: Role;
        };
    }[];
};
export declare class TasksService {
    private prisma;
    private readonly assignmentOrchestrator;
    private readonly taskLifecycle;
    constructor(prisma: PrismaService, assignmentOrchestrator: TaskAssignmentOrchestratorService, taskLifecycle: TaskLifecycleService);
    private assertEndAfterStart;
    private static readonly GEOFENCE_ERR;
    private requireFiniteCreateScalar;
    private assertValidGeofence;
    private effectiveFloatFromUpdatePatch;
    private toDate;
    private effectiveDateFromUpdatePatch;
    create(data: Prisma.TaskCreateInput): Promise<Task>;
    findAll(query: TaskListQuery): Promise<Task[]>;
    findOneInOrganization(id: string, organizationId: string): Promise<TaskWithAssignments>;
    assertTeamLeaderOwnsTask(task: TaskWithAssignments, actorId: string): void;
    private assertActorCanManageTaskAssignments;
    supervisorRolesForTaskAttendance(): Role[];
    assertActorCanViewTaskAttendance(task: TaskWithAssignments, actorId: string, role: Role): void;
    assertTeamLeaderOfTask(taskId: string, organizationId: string, teamLeaderId: string): Promise<void>;
    findTasksForTeamLeader(userId: string, organizationId: string): Promise<({
        _count: {
            attendances: number;
            reports: number;
        };
        assignments: ({
            user: {
                id: string;
                email: string;
                role: import("@prisma/client").$Enums.Role;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            userId: string;
            taskId: string;
        })[];
    } & {
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
    })[]>;
    findOneForRequester(id: string, requesterId: string, requesterRole: Role, organizationId: string): Promise<Task>;
    findAssignedToUser(userId: string, organizationId: string): Promise<Task[]>;
    assertUserAssignedToTask(userId: string, taskId: string): Promise<void>;
    assignUserToTask(taskId: string, userId: string, organizationId: string, actor?: {
        id: string;
        role: Role;
    }): Promise<TaskAssignment>;
    removeUserFromTask(taskId: string, userId: string, organizationId: string, actor?: {
        id: string;
        role: Role;
    }): Promise<void>;
    update(id: string, organizationId: string, data: Prisma.TaskUpdateInput): Promise<Task>;
    remove(id: string, organizationId: string): Promise<Task>;
    private mapLegacyUiStatus;
    assignWithStrategy(taskId: string, organizationId: string, actorId: string, role: Role, mode: AssignmentMode, userIds?: string[]): Promise<import("../field-ops/domain/task-assignment/assignment-strategy.interface").AssignmentResult>;
    private patchDtoToPrismaUpdate;
    patchTeamLeader(id: string, organizationId: string, actorId: string, role: Role, dto: PatchTaskDto): Promise<Task>;
}
