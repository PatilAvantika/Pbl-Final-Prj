import { PrismaService } from '../prisma/prisma.service';
export declare class ResourcesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAllByOrganization(organizationId: string): import("@prisma/client").Prisma.PrismaPromise<{
        organizationId: string;
        id: string;
        name: string;
        quantity: number;
    }[]>;
    allocate(organizationId: string, resourceId: string, taskId: string, quantity: number): Promise<{
        id: string;
        taskId: string;
        quantity: number;
        resourceId: string;
    }>;
}
