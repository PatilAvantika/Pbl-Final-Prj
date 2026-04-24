import { TaskLifecycleStatus } from '@prisma/client';
import { UpdateTaskDto } from './task-mutations.dto';
declare const PatchTaskDto_base: import("@nestjs/mapped-types").MappedType<Partial<UpdateTaskDto>>;
export declare class PatchTaskDto extends PatchTaskDto_base {
    lifecycleStatus?: TaskLifecycleStatus;
    status?: string;
    assigneeIds?: string[];
}
export declare class AssignStrategyDto {
    mode: 'open' | 'bulk';
    userIds?: string[];
}
export {};
