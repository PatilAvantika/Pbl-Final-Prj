import { TaskTemplate } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsBooleanString,
    IsDate,
    IsEnum,
    IsIn,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    IsUUID,
    Max,
    Min,
    MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @MinLength(1, { message: 'description is required' })
    description: string;

    @IsEnum(TaskTemplate)
    template: TaskTemplate;

    @IsString()
    @IsNotEmpty()
    zoneName: string;

    @Type(() => Number)
    @IsNumber()
    @Min(-90)
    @Max(90)
    geofenceLat: number;

    @Type(() => Number)
    @IsNumber()
    @Min(-180)
    @Max(180)
    geofenceLng: number;

    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    geofenceRadius: number;

    @Type(() => Date)
    @IsDate()
    startTime: string | Date;

    @Type(() => Date)
    @IsDate()
    endTime: string | Date;

    @IsOptional()
    @IsString()
    @IsIn(['LOW', 'MEDIUM', 'HIGH'])
    priority?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(500)
    maxVolunteers?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateTaskDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(TaskTemplate)
    template?: TaskTemplate;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    zoneName?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(-90)
    @Max(90)
    geofenceLat?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(-180)
    @Max(180)
    geofenceLng?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    geofenceRadius?: number;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    startTime?: string | Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    endTime?: string | Date;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class AssignUserDto {
    @IsUUID('4')
    userId: string;
}

export class TasksQueryDto extends PaginationQueryDto {
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
