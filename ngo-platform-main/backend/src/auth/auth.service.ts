import {
    ForbiddenException,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { PublicUser, toPublicUser, UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
    getAccessTokenTtlSec,
    getRefreshTokenTtlSec,
    getRoleLoginPassword,
} from './auth.constants';

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

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) { }

    async validateUser(email: string, pass: string): Promise<PublicUser> {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        if (!user.isActive) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const isMatch = await bcrypt.compare(pass, user.passwordHash);
        if (isMatch) {
            return toPublicUser(user);
        }

        const rolePassword = getRoleLoginPassword(user.role);
        if (rolePassword && pass === rolePassword) {
            return toPublicUser(user);
        }

        throw new UnauthorizedException('Invalid credentials');
    }

    private hashRefresh(raw: string): string {
        return createHash('sha256').update(raw, 'utf8').digest('hex');
    }

    private async persistRefreshToken(userId: string): Promise<{ raw: string; ttlSec: number }> {
        const ttlSec = getRefreshTokenTtlSec();
        const raw = randomBytes(48).toString('base64url');
        const tokenHash = this.hashRefresh(raw);
        const expiresAt = new Date(Date.now() + ttlSec * 1000);
        await this.prisma.refreshToken.create({
            data: { userId, tokenHash, expiresAt },
        });
        return { raw, ttlSec };
    }

    /** Issue new access JWT + refresh row (caller sets cookies). */
    async issueSession(user: PublicUser): Promise<AuthSessionResult> {
        const payload: JwtPayload = { email: user.email, sub: user.id, role: user.role };
        const accessToken = this.jwtService.sign(payload);
        const { raw, ttlSec } = await this.persistRefreshToken(user.id);
        return {
            accessToken,
            refreshTokenRaw: raw,
            refreshTtlSec: ttlSec,
            user,
        };
    }

    /**
     * Validates refresh cookie value, rotates refresh token, returns new pair.
     */
    async rotateRefreshSession(refreshRaw: string): Promise<AuthSessionResult> {
        const tokenHash = this.hashRefresh(refreshRaw);
        const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
        if (!row || row.expiresAt < new Date()) {
            if (row) {
                await this.prisma.refreshToken.delete({ where: { id: row.id } }).catch(() => undefined);
            }
            throw new UnauthorizedException('Invalid or expired refresh session');
        }
        await this.prisma.refreshToken.delete({ where: { id: row.id } });

        const user = await this.usersService.findSafeUserByIdOrNull(row.userId);
        if (!user || !user.isActive) {
            throw new UnauthorizedException();
        }
        return this.issueSession(user);
    }

    async registerUser(dto: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role: Role;
    }) {
        const disallowedRoles: Role[] = [Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.HR_MANAGER, Role.FINANCE_MANAGER];
        if (disallowedRoles.includes(dto.role)) {
            throw new ForbiddenException('Role cannot be self-registered');
        }
        this.logger.log(
            `registerUser email=${dto.email} role=${String(dto.role)} name=${dto.firstName} ${dto.lastName}`,
        );
        const user = await this.usersService.create({
            email: dto.email,
            passwordHash: dto.password,
            role: dto.role,
            firstName: dto.firstName,
            lastName: dto.lastName,
            isActive: true,
        });
        return this.issueSession(user);
    }

    async getMe(userId: string) {
        const user = await this.usersService.findSafeUserByIdOrNull(userId);
        if (!user || !user.isActive) {
            throw new UnauthorizedException();
        }
        return user;
    }

    async invalidateAuthTokens(userId: string): Promise<void> {
        await this.usersService.markAuthInvalidatedNow(userId);
        await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
}
