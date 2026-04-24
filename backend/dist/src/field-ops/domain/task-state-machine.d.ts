import { TaskLifecycleStatus } from '@prisma/client';
export declare function assertTaskLifecycleTransition(from: TaskLifecycleStatus, to: TaskLifecycleStatus): void;
export declare function lifecycleToTaskFlags(to: TaskLifecycleStatus): {
    isActive: boolean;
    lifecycleStatus: TaskLifecycleStatus;
};
