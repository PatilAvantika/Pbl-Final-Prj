import { UsersService } from './users.service';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
export declare class CreateUserDto {
    email: string;
    passwordHash: string;
    role: Role;
    firstName: string;
    lastName: string;
    isActive?: boolean;
}
export declare class UpdateUserDto {
    firstName?: string;
    lastName?: string;
    passwordHash?: string;
    isActive?: boolean;
    role?: Role;
}
export declare class UsersQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    role?: Role;
    isActive?: string;
}
export declare class UsersController {
    private readonly usersService;
    private readonly auditService;
    constructor(usersService: UsersService, auditService: AuditService);
    create(data: CreateUserDto, req: any): Promise<{
        isActive: boolean;
        id: string;
        deviceId: string | null;
        createdAt: Date;
        email: string;
        passwordHash: string;
        role: import("@prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
    }>;
    findAll(query: UsersQueryDto): Promise<{
        isActive: boolean;
        id: string;
        deviceId: string | null;
        createdAt: Date;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
    }[]>;
    findOne(id: string): Promise<{
        isActive: boolean;
        id: string;
        deviceId: string | null;
        createdAt: Date;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
    }>;
    update(id: string, data: UpdateUserDto, req: any): Promise<{
        isActive: boolean;
        id: string;
        deviceId: string | null;
        createdAt: Date;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
    }>;
    remove(id: string, req: any): Promise<{
        isActive: boolean;
        id: string;
        deviceId: string | null;
        createdAt: Date;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
    }>;
}
