import { UsersService } from './users.service';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
export declare class CreateUserDto {
    email: string;
    password: string;
    role: Role;
    firstName: string;
    lastName: string;
    isActive?: boolean;
}
export declare class UpdateUserDto {
    firstName?: string;
    lastName?: string;
    password?: string;
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
    create(data: CreateUserDto, req: any): Promise<import("./users.service").PublicUser>;
    findAll(query: UsersQueryDto): Promise<import("./users.service").PublicUser[]>;
    findOne(id: string): Promise<import("./users.service").PublicUser>;
    update(id: string, data: UpdateUserDto, req: any): Promise<import("./users.service").PublicUser>;
    remove(id: string, req: any): Promise<import("./users.service").PublicUser>;
}
