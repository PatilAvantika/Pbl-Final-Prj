import { BadRequestException } from '@nestjs/common';
import { TaskLifecycleStatus } from '@prisma/client';

const allowed: Record<TaskLifecycleStatus, TaskLifecycleStatus[]> = {
    [TaskLifecycleStatus.PENDING]: [TaskLifecycleStatus.ACTIVE, TaskLifecycleStatus.CANCELLED],
    [TaskLifecycleStatus.ACTIVE]: [TaskLifecycleStatus.COMPLETED, TaskLifecycleStatus.CANCELLED],
    [TaskLifecycleStatus.COMPLETED]: [],
    [TaskLifecycleStatus.CANCELLED]: [],
};

export function assertTaskLifecycleTransition(from: TaskLifecycleStatus, to: TaskLifecycleStatus): void {
    if (from === to) return;
    if (!allowed[from]?.includes(to)) {
        throw new BadRequestException(`Invalid task lifecycle transition ${from} → ${to}`);
    }
}

export function lifecycleToTaskFlags(
    to: TaskLifecycleStatus,
): { isActive: boolean; lifecycleStatus: TaskLifecycleStatus } {
    switch (to) {
        case TaskLifecycleStatus.PENDING:
            return { isActive: true, lifecycleStatus: TaskLifecycleStatus.PENDING };
        case TaskLifecycleStatus.ACTIVE:
            return { isActive: true, lifecycleStatus: TaskLifecycleStatus.ACTIVE };
        case TaskLifecycleStatus.COMPLETED:
            return { isActive: false, lifecycleStatus: TaskLifecycleStatus.COMPLETED };
        case TaskLifecycleStatus.CANCELLED:
            return { isActive: false, lifecycleStatus: TaskLifecycleStatus.CANCELLED };
        default:
            return { isActive: true, lifecycleStatus: to };
    }
}
