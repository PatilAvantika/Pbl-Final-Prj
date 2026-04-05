import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
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
            secretOrKey: process.env.JWT_SECRET || 'dev_secret_change_me',
        });
    }

    async validate(payload: JwtPayload) {
        return { id: payload.sub, email: payload.email, role: payload.role };
    }
}
