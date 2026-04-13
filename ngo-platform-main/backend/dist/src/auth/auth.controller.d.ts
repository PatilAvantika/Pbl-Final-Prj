import { AuthService } from './auth.service';
import { RegisterDto } from './dto/auth.dto';
import type { Response, Request as ExpressRequest } from 'express';
import { LoginDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: LoginDto, res: Response): Promise<{
        user: import("../users/users.service").PublicUser;
    }>;
    refresh(req: ExpressRequest, res: Response): Promise<{
        success: boolean;
    }>;
    register(body: RegisterDto, res: Response): Promise<{
        user: import("../users/users.service").PublicUser;
    }>;
    getMe(req: {
        user: {
            id: string;
        };
    }): Promise<import("../users/users.service").PublicUser>;
    logout(req: {
        user: {
            id: string;
        };
    }, res: Response): Promise<{
        success: boolean;
    }>;
}
