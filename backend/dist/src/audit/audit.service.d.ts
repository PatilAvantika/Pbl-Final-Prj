import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export interface AuditListQuery {
    page?: number;
    limit?: number;
    actorId?: string;
    action?: AuditAction;
    entityType?: string;
    entityId?: string;
}
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(params: {
        actorId?: string;
        action: AuditAction;
        entityType: string;
        entityId: string;
        metadata?: Prisma.InputJsonValue;
    }): Promise<{
        id: string;
        createdAt: Date;
        actorId: string | null;
        action: import("@prisma/client").$Enums.AuditAction;
        entityType: string;
        entityId: string;
        metadata: Prisma.JsonValue | null;
    }>;
    findAll(query?: AuditListQuery): Promise<({
        actor: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        actorId: string | null;
        action: import("@prisma/client").$Enums.AuditAction;
        entityType: string;
        entityId: string;
        metadata: Prisma.JsonValue | null;
    })[]>;
}
