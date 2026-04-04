import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from './auth.service';
import { UsersService } from '../users/users.service';
import { getJwtSecret } from './auth.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly usersService: UsersService) {
        const cookieExtractor = (req: any): string | null => {
            if (!req?.headers?.cookie) return null;
            const tokenCookie = req.headers.cookie
                .split(';')
                .map((v: string) => v.trim())
                .find((v: string) => v.startsWith('token='));
            return tokenCookie ? decodeURIComponent(tokenCookie.split('=')[1]) : null;
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
        return { id: principal.id, email: principal.email, role: principal.role };
    }
}
