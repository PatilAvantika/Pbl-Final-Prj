import { TaskLifecycleStatus, TaskTemplate } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBooleanString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminTasksQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(TaskLifecycleStatus)
  lifecycleStatus?: TaskLifecycleStatus;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TaskTemplate)
  template?: TaskTemplate;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}
