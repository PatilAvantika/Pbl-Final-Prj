import { Role } from '@prisma/client';
import { ResourcesService } from './resources.service';
import { AllocateResourceDto, CreateResourceDto } from './dto/allocate-resource.dto';
type Authed = Request & {
    user: {
        id: string;
        role: Role;
        organizationId?: string;
    };
};
export declare class ResourcesController {
    private readonly resourcesService;
    constructor(resourcesService: ResourcesService);
    list(req: Authed): import("@prisma/client").Prisma.PrismaPromise<{
        organizationId: string;
        id: string;
        name: string;
        quantity: number;
    }[]>;
    listAllocations(req: Authed): Promise<({
        task: {
            id: string;
            title: string;
        };
        resource: {
            organizationId: string;
            id: string;
            name: string;
            quantity: number;
        };
    } & {
        id: string;
        taskId: string;
        quantity: number;
        resourceId: string;
    })[]>;
    create(dto: CreateResourceDto, req: Authed): Promise<{
        organizationId: string;
        id: string;
        name: string;
        quantity: number;
    }>;
    allocate(dto: AllocateResourceDto, req: Authed): Promise<{
        id: string;
        taskId: string;
        quantity: number;
        resourceId: string;
    }>;
}
export {};
