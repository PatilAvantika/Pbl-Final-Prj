import { JwtService } from '@nestjs/jwt';
import { PublicUser, UsersService } from '../users/users.service';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export interface JwtPayload {
    email: string;
    sub: string;
    role: Role;
}
export interface AuthSessionResult {
    accessToken: string;
    refreshTokenRaw: string;
    refreshTtlSec: number;
    user: PublicUser;
}
export declare class AuthService {
    private usersService;
    private jwtService;
    private prisma;
    private readonly logger;
    constructor(usersService: UsersService, jwtService: JwtService, prisma: PrismaService);
    validateUser(email: string, pass: string): Promise<PublicUser>;
    private hashRefresh;
    private persistRefreshToken;
    issueSession(user: PublicUser): Promise<AuthSessionResult>;
    rotateRefreshSession(refreshRaw: string): Promise<AuthSessionResult>;
    registerUser(dto: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role: Role;
    }): Promise<AuthSessionResult>;
    getMe(userId: string): Promise<PublicUser>;
    invalidateAuthTokens(userId: string): Promise<void>;
}
