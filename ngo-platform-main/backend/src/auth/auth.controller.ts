import { Controller, Post, Body, UseGuards, Request, Get, Res } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import type { Response } from 'express';
import { getJwtExpiresSec } from './auth.constants';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    private setAuthCookie(res: Response, token: string) {
        const maxAgeMs = getJwtExpiresSec() * 1000;
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: maxAgeMs,
            path: '/',
        });
    }

    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 10, ttl: 60_000 } })
    @Post('login')
    async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
        const user = await this.authService.validateUser(body.email, body.password);
        const result = await this.authService.login(user);
        this.setAuthCookie(res, result.access_token);
        return result;
    }

    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 5, ttl: 60_000 } })
    @Post('register')
    async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.registerUser(body);
        this.setAuthCookie(res, result.access_token);
        return result;
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    getMe(@Request() req: any) {
        return this.authService.getMe(req.user.id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('logout')
    async logout(
        @Request() req: { user: { id: string } },
        @Res({ passthrough: true }) res: Response,
    ) {
        await this.authService.invalidateAuthTokens(req.user.id);
        res.clearCookie('token', { path: '/' });
        return { success: true };
    }
}
