import { Role } from '@prisma/client';
import { ResourcesRepository } from './resources.repository';
import { AllocateResourceDto, CreateResourceDto } from './dto/allocate-resource.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class ResourcesService {
    private readonly repo;
    private readonly prisma;
    constructor(repo: ResourcesRepository, prisma: PrismaService);
    list(organizationId: string): import("@prisma/client").Prisma.PrismaPromise<{
        organizationId: string;
        id: string;
        name: string;
        quantity: number;
    }[]>;
    create(organizationId: string, dto: CreateResourceDto): Promise<{
        organizationId: string;
        id: string;
        name: string;
        quantity: number;
    }>;
    listAllocations(userId: string, role: Role, organizationId: string): Promise<({
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
    allocate(actorId: string, role: Role, organizationId: string, dto: AllocateResourceDto): Promise<{
        id: string;
        taskId: string;
        quantity: number;
        resourceId: string;
    }>;
}
