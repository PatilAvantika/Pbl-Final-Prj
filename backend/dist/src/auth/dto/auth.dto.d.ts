import { Role } from '@prisma/client';
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RegisterDto {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    role: Role;
    isActive?: boolean;
}
