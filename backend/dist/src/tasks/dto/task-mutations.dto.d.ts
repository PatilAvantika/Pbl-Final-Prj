import { TaskTemplate } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
export declare class CreateTaskDto {
    title: string;
    description: string;
    template: TaskTemplate;
    zoneName: string;
    geofenceLat: number;
    geofenceLng: number;
    geofenceRadius: number;
    startTime: string | Date;
    endTime: string | Date;
    priority?: string;
    maxVolunteers?: number;
    isActive?: boolean;
}
export declare class UpdateTaskDto {
    title?: string;
    description?: string;
    template?: TaskTemplate;
    zoneName?: string;
    geofenceLat?: number;
    geofenceLng?: number;
    geofenceRadius?: number;
    startTime?: string | Date;
    endTime?: string | Date;
    isActive?: boolean;
}
export declare class AssignUserDto {
    userId: string;
}
export declare class TasksQueryDto extends PaginationQueryDto {
    search?: string;
    template?: TaskTemplate;
    isActive?: string;
}
