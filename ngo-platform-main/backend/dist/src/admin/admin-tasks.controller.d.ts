import { AdminTasksService } from './admin-tasks.service';
import { AdminTasksQueryDto } from './dto/admin-tasks-query.dto';
import { AdminPatchTaskDto } from './dto/admin-patch-task.dto';
export declare class AdminTasksController {
    private readonly adminTasks;
    constructor(adminTasks: AdminTasksService);
    list(query: AdminTasksQueryDto, req: {
        user?: {
            organizationId?: string;
        };
    }): Promise<{
        tasks: import("./admin-tasks.service").AdminTaskListItem[];
        total: number;
        limit: number;
        offset: number;
    }>;
    findOne(id: string, req: {
        user?: {
            organizationId?: string;
        };
    }): Promise<import("../tasks/tasks.service").TaskWithAssignments>;
    patch(id: string, body: AdminPatchTaskDto, req: {
        user?: {
            id?: string;
            organizationId?: string;
        };
    }): Promise<{
        organizationId: string;
        isActive: boolean;
        lifecycleStatus: import("@prisma/client").$Enums.TaskLifecycleStatus;
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
        priority: string | null;
        maxVolunteers: number | null;
        teamLeaderId: string | null;
    }>;
    remove(id: string, req: {
        user?: {
            id?: string;
            organizationId?: string;
        };
    }): Promise<{
        organizationId: string;
        isActive: boolean;
        lifecycleStatus: import("@prisma/client").$Enums.TaskLifecycleStatus;
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
        priority: string | null;
        maxVolunteers: number | null;
        teamLeaderId: string | null;
    }>;
}
