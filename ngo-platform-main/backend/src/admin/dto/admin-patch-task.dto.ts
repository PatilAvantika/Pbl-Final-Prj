import { TaskLifecycleStatus } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { UpdateTaskDto } from '../../tasks/dto/task-mutations.dto';

export class AdminPatchTaskDto extends PartialType(UpdateTaskDto) {
  @IsOptional()
  @IsEnum(TaskLifecycleStatus)
  lifecycleStatus?: TaskLifecycleStatus;

  /** When present, replaces all task assignments (empty array clears). */
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assignedUserIds?: string[];
}
