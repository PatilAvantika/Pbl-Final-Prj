import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

export interface JwtPayload {
    email: string;
    sub: string;
    role: Role;
}

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const isMatch = await bcrypt.compare(pass, user.passwordHash);
        if (isMatch) {
            const { passwordHash, ...result } = user;
            return result;
        }
        throw new UnauthorizedException('Invalid credentials');
    }

    async login(user: any) {
        const payload: JwtPayload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
            }
        };
    }

    async registerUser(data: any) {
        const disallowedRoles: Role[] = [Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.HR_MANAGER, Role.FINANCE_MANAGER];
        if (disallowedRoles.includes(data.role)) {
            throw new ForbiddenException('Role cannot be self-registered');
        }
        const user = await this.usersService.create(data);
        return this.login(user);
    }

    async getProfile(userId: string) {
        return this.usersService.findOne(userId);
    }
}
