import { TaskLifecycleStatus, TaskTemplate } from '@prisma/client';
export declare class AdminTasksQueryDto {
    offset?: number;
    limit?: number;
    lifecycleStatus?: TaskLifecycleStatus;
    from?: string;
    to?: string;
    search?: string;
    template?: TaskTemplate;
    isActive?: string;
}
