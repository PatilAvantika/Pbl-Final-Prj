import {
    Controller,
    Post,
    Body,
    UseGuards,
    Request,
    Get,
    Res,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto } from './dto/auth.dto';
import type { Response, Request as ExpressRequest } from 'express';
import {
    clearAuthCookies,
    setAccessTokenCookie,
    setRefreshTokenCookie,
    REFRESH_TOKEN_COOKIE,
} from './cookie.util';
import { LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 10, ttl: 60_000 } })
    @Post('login')
    async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
        const user = await this.authService.validateUser(body.email, body.password);
        const session = await this.authService.issueSession(user);
        setAccessTokenCookie(res, session.accessToken);
        setRefreshTokenCookie(res, session.refreshTokenRaw, session.refreshTtlSec);
        return { user: session.user };
    }

    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 20, ttl: 60_000 } })
    @Post('refresh')
    async refresh(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
        const raw = req.cookies?.[REFRESH_TOKEN_COOKIE];
        if (!raw || typeof raw !== 'string') {
            throw new UnauthorizedException('Missing refresh session');
        }
        const session = await this.authService.rotateRefreshSession(raw);
        setAccessTokenCookie(res, session.accessToken);
        setRefreshTokenCookie(res, session.refreshTokenRaw, session.refreshTtlSec);
        return { success: true };
    }

    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 5, ttl: 60_000 } })
    @Post('register')
    async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
        const session = await this.authService.registerUser(body);
        setAccessTokenCookie(res, session.accessToken);
        setRefreshTokenCookie(res, session.refreshTokenRaw, session.refreshTtlSec);
        return { user: session.user };
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    getMe(@Request() req: { user: { id: string } }) {
        return this.authService.getMe(req.user.id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('logout')
    async logout(
        @Request() req: { user: { id: string } },
        @Res({ passthrough: true }) res: Response,
    ) {
        await this.authService.invalidateAuthTokens(req.user.id);
        clearAuthCookies(res);
        return { success: true };
    }
}
