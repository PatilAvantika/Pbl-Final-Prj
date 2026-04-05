import { TasksService } from './tasks.service';
import { TaskTemplate } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AuditService } from '../audit/audit.service';
export declare class CreateTaskDto {
    title: string;
    description?: string;
    template: TaskTemplate;
    zoneName: string;
    geofenceLat: number;
    geofenceLng: number;
    geofenceRadius: number;
    startTime: string | Date;
    endTime: string | Date;
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
export declare class TasksController {
    private readonly tasksService;
    private readonly auditService;
    constructor(tasksService: TasksService, auditService: AuditService);
    create(data: CreateTaskDto, req: any): Promise<{
        isActive: boolean;
        id: string;
        title: string;
        description: string | null;
        template: import("@prisma/client").$Enums.TaskTemplate;
        zoneName: string;
        geofenceLat: number;
        geofenceLng: number;
        geofenceRadius: number;
        startTime: Date;
        endTime: Date;
    }>;
    findAll(query: TasksQueryDto): Promise<{
        isActive: boolean;
        id: string;
        title: string;
        description: string | null;
        template: import("@prisma/client").$Enums.TaskTemplate;
        zoneName: string;
        geofenceLat: number;
        geofenceLng: number;
        geofenceRadius: number;
        startTime: Date;
        endTime: Date;
    }[]>;
    findMyTasks(req: any): Promise<{
        isActive: boolean;
        id: string;
        title: string;
        description: string | null;
        template: import("@prisma/client").$Enums.TaskTemplate;
        zoneName: string;
        geofenceLat: number;
        geofenceLng: number;
        geofenceRadius: number;
        startTime: Date;
        endTime: Date;
    }[]>;
    findOne(id: string, req: any): Promise<{
        isActive: boolean;
        id: string;
        title: string;
        description: string | null;
        template: import("@prisma/client").$Enums.TaskTemplate;
        zoneName: string;
        geofenceLat: number;
        geofenceLng: number;
        geofenceRadius: number;
        startTime: Date;
        endTime: Date;
    }>;
    update(id: string, updateTaskDto: Partial<CreateTaskDto>, req: any): Promise<{
        isActive: boolean;
        id: string;
        title: string;
        description: string | null;
        template: import("@prisma/client").$Enums.TaskTemplate;
        zoneName: string;
        geofenceLat: number;
        geofenceLng: number;
        geofenceRadius: number;
        startTime: Date;
        endTime: Date;
    }>;
    remove(id: string, req: any): Promise<{
        isActive: boolean;
        id: string;
        title: string;
        description: string | null;
        template: import("@prisma/client").$Enums.TaskTemplate;
        zoneName: string;
        geofenceLat: number;
        geofenceLng: number;
        geofenceRadius: number;
        startTime: Date;
        endTime: Date;
    }>;
    assignUser(taskId: string, data: AssignUserDto, req: any): Promise<{
        id: string;
        userId: string;
        taskId: string;
    }>;
    removeUser(taskId: string, userId: string, req: any): Promise<{
        success: boolean;
    }>;
}
