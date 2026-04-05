import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { Role } from '@prisma/client';
export interface JwtPayload {
    email: string;
    sub: string;
    role: Role;
}
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            role: any;
            firstName: any;
            lastName: any;
        };
    }>;
    registerUser(data: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            role: any;
            firstName: any;
            lastName: any;
        };
    }>;
    getProfile(userId: string): Promise<{
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
