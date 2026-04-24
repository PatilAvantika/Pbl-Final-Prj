import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from './auth.service';
import { UsersService } from '../users/users.service';
import { getJwtSecret } from './auth.constants';
import { ACCESS_TOKEN_COOKIE, LEGACY_TOKEN_COOKIE } from './auth.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly usersService: UsersService) {
        const cookieExtractor = (req: { headers?: { cookie?: string } }): string | null => {
            if (!req?.headers?.cookie) return null;
            const parts = req.headers.cookie.split(';').map((v: string) => v.trim());
            const access = parts.find((v: string) => v.startsWith(`${ACCESS_TOKEN_COOKIE}=`));
            if (access) {
                return decodeURIComponent(access.split('=').slice(1).join('='));
            }
            const legacy = parts.find((v: string) => v.startsWith(`${LEGACY_TOKEN_COOKIE}=`));
            return legacy ? decodeURIComponent(legacy.split('=').slice(1).join('=')) : null;
        };
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                cookieExtractor,
            ]),
            ignoreExpiration: false,
            secretOrKey: getJwtSecret(),
        });
    }

    async validate(payload: JwtPayload & { iat?: number }) {
        const principal = await this.usersService.findAuthPrincipalById(payload.sub);
        if (!principal || !principal.isActive) {
            throw new UnauthorizedException();
        }
        if (
            principal.authInvalidatedAt != null &&
            payload.iat != null &&
            payload.iat * 1000 < principal.authInvalidatedAt.getTime()
        ) {
            throw new UnauthorizedException();
        }
        return {
            id: principal.id,
            email: principal.email,
            role: principal.role,
            organizationId: principal.organizationId,
        };
    }
}
