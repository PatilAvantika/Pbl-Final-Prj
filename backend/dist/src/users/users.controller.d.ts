import { UsersService } from './users.service';
import { Role } from '@prisma/client';
export declare class CreateUserDto {
    email: string;
    passwordHash: string;
    role: Role;
    firstName: string;
    lastName: string;
}
export declare class UpdateUserDto {
    firstName?: string;
    lastName?: string;
    passwordHash?: string;
    isActive?: boolean;
}
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(data: CreateUserDto): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        role: import("@prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
        deviceId: string | null;
        isActive: boolean;
        createdAt: Date;
    }>;
    findAll(): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        role: import("@prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
        deviceId: string | null;
        isActive: boolean;
        createdAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        role: import("@prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
        deviceId: string | null;
        isActive: boolean;
        createdAt: Date;
    }>;
    update(id: string, data: UpdateUserDto): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        role: import("@prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
        deviceId: string | null;
        isActive: boolean;
        createdAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        role: import("@prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
        deviceId: string | null;
        isActive: boolean;
        createdAt: Date;
    }>;
}
