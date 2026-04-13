"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const passport_jwt_1 = require("passport-jwt");
const passport_1 = require("@nestjs/passport");
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const auth_constants_1 = require("./auth.constants");
const auth_constants_2 = require("./auth.constants");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    usersService;
    constructor(usersService) {
        const cookieExtractor = (req) => {
            if (!req?.headers?.cookie)
                return null;
            const parts = req.headers.cookie.split(';').map((v) => v.trim());
            const access = parts.find((v) => v.startsWith(`${auth_constants_2.ACCESS_TOKEN_COOKIE}=`));
            if (access) {
                return decodeURIComponent(access.split('=').slice(1).join('='));
            }
            const legacy = parts.find((v) => v.startsWith(`${auth_constants_2.LEGACY_TOKEN_COOKIE}=`));
            return legacy ? decodeURIComponent(legacy.split('=').slice(1).join('=')) : null;
        };
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
                passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
                cookieExtractor,
            ]),
            ignoreExpiration: false,
            secretOrKey: (0, auth_constants_1.getJwtSecret)(),
        });
        this.usersService = usersService;
    }
    async validate(payload) {
        const principal = await this.usersService.findAuthPrincipalById(payload.sub);
        if (!principal || !principal.isActive) {
            throw new common_1.UnauthorizedException();
        }
        if (principal.authInvalidatedAt != null &&
            payload.iat != null &&
            payload.iat * 1000 < principal.authInvalidatedAt.getTime()) {
            throw new common_1.UnauthorizedException();
        }
        return {
            id: principal.id,
            email: principal.email,
            role: principal.role,
            organizationId: principal.organizationId,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map