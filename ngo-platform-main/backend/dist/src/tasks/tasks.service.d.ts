import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role, Task, TaskAssignment, TaskTemplate } from '@prisma/client';
export interface TaskListQuery {
    page?: number;
    limit?: number;
    search?: string;
    template?: TaskTemplate;
    isActive?: boolean;
}
export declare class TasksService {
    private prisma;
    constructor(prisma: PrismaService);
    private assertEndAfterStart;
    private static readonly GEOFENCE_ERR;
    private requireFiniteCreateScalar;
    private assertValidGeofence;
    private effectiveFloatFromUpdatePatch;
    private toDate;
    private effectiveDateFromUpdatePatch;
    create(data: Prisma.TaskCreateInput): Promise<Task>;
    findAll(query?: TaskListQuery): Promise<Task[]>;
    findOne(id: string): Promise<Task>;
    findOneForRequester(id: string, requesterId: string, requesterRole: Role): Promise<Task>;
    findAssignedToUser(userId: string): Promise<Task[]>;
    assertUserAssignedToTask(userId: string, taskId: string): Promise<void>;
    assignUserToTask(taskId: string, userId: string): Promise<TaskAssignment>;
    removeUserFromTask(taskId: string, userId: string): Promise<void>;
    update(id: string, data: Prisma.TaskUpdateInput): Promise<Task>;
    remove(id: string): Promise<Task>;
}
