import { Injectable } from '@nestjs/common';
import { Task, TaskLifecycleStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { assertTaskLifecycleTransition, lifecycleToTaskFlags } from '../domain/task-state-machine';

@Injectable()
export class TaskLifecycleService {
    constructor(private readonly prisma: PrismaService) {}

    applyTransition(task: Task, to: TaskLifecycleStatus): Promise<Task> {
        assertTaskLifecycleTransition(task.lifecycleStatus, to);
        const flags = lifecycleToTaskFlags(to);
        return this.prisma.task.update({
            where: { id: task.id },
            data: {
                lifecycleStatus: flags.lifecycleStatus,
                isActive: flags.isActive,
            },
        });
    }
}
