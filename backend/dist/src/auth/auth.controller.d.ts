import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import type { Response } from 'express';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    private setAuthCookie;
    login(body: LoginDto, res: Response): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            role: any;
            firstName: any;
            lastName: any;
        };
    }>;
    register(body: RegisterDto, res: Response): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            role: any;
            firstName: any;
            lastName: any;
        };
    }>;
    getProfile(req: any): Promise<{
        isActive: boolean;
        id: string;
        deviceId: string | null;
        createdAt: Date;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
    }>;
    logout(res: Response): {
        success: boolean;
    };
}
