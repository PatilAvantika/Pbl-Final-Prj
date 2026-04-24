import type { Response } from 'express';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './auth.constants';
export declare function setAccessTokenCookie(res: Response, accessToken: string): void;
export declare function setRefreshTokenCookie(res: Response, refreshToken: string, maxAgeSec: number): void;
export declare function clearAuthCookies(res: Response): void;
export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE };
