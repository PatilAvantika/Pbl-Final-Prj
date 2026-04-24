import { TaskLifecycleStatus } from '@prisma/client';
import { UpdateTaskDto } from '../../tasks/dto/task-mutations.dto';
declare const AdminPatchTaskDto_base: import("@nestjs/mapped-types").MappedType<Partial<UpdateTaskDto>>;
export declare class AdminPatchTaskDto extends AdminPatchTaskDto_base {
    lifecycleStatus?: TaskLifecycleStatus;
    assignedUserIds?: string[];
}
export {};
