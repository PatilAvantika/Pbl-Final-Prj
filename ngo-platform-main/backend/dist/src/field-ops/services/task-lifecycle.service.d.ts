import { Task, TaskLifecycleStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export declare class TaskLifecycleService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    applyTransition(task: Task, to: TaskLifecycleStatus): Promise<Task>;
}
