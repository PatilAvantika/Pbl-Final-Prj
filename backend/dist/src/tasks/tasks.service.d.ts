import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Task, TaskAssignment } from '@prisma/client';
export declare class TasksService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.TaskCreateInput): Promise<Task>;
    findAll(): Promise<Task[]>;
    findOne(id: string): Promise<Task>;
    findAssignedToUser(userId: string): Promise<Task[]>;
    assignUserToTask(taskId: string, userId: string): Promise<TaskAssignment>;
    removeUserFromTask(taskId: string, userId: string): Promise<void>;
    update(id: string, data: Prisma.TaskUpdateInput): Promise<Task>;
    remove(id: string): Promise<Task>;
}
