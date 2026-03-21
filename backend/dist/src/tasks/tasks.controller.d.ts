import { TasksService } from './tasks.service';
import { TaskTemplate } from '@prisma/client';
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
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    create(data: CreateTaskDto): Promise<{
        id: string;
        isActive: boolean;
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
    findAll(): Promise<{
        id: string;
        isActive: boolean;
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
        id: string;
        isActive: boolean;
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
    findOne(id: string): Promise<{
        id: string;
        isActive: boolean;
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
    update(id: string, updateTaskDto: Partial<CreateTaskDto>): Promise<{
        id: string;
        isActive: boolean;
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
    remove(id: string): Promise<{
        id: string;
        isActive: boolean;
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
    assignUser(taskId: string, data: AssignUserDto): Promise<{
        id: string;
        taskId: string;
        userId: string;
    }>;
    removeUser(taskId: string, userId: string): Promise<void>;
}
