import { PartialType } from '@nestjs/mapped-types';
import { TaskLifecycleStatus } from '@prisma/client';
import { IsArray, IsEnum, IsIn, IsOptional, IsUUID } from 'class-validator';
import { UpdateTaskDto } from './task-mutations.dto';

export class PatchTaskDto extends PartialType(UpdateTaskDto) {
    @IsOptional()
    @IsEnum(TaskLifecycleStatus)
    lifecycleStatus?: TaskLifecycleStatus;

    /** Legacy team-leader UI (`IN_PROGRESS` → ACTIVE). */
    @IsOptional()
    @IsIn(['PENDING', 'IN_PROGRESS', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
    status?: string;

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    assigneeIds?: string[];
}

export class AssignStrategyDto {
    @IsIn(['open', 'bulk'])
    mode: 'open' | 'bulk';

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    userIds?: string[];
}
