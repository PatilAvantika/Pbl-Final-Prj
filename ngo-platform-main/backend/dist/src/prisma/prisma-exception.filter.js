"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaKnownRequestExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaKnownRequestExceptionFilter = class PrismaKnownRequestExceptionFilter {
    catch(exception, host) {
        const res = host.switchToHttp().getResponse();
        const unreachable = new Set([
            'P1001',
            'P1002',
            'P1003',
            'P1017',
            'P1011',
        ]);
        if (unreachable.has(exception.code)) {
            return res.status(common_1.HttpStatus.SERVICE_UNAVAILABLE).json({
                statusCode: common_1.HttpStatus.SERVICE_UNAVAILABLE,
                error: 'Service Unavailable',
                message: 'Cannot reach the database. If you use Neon: wake the project in the Neon console, confirm DATABASE_URL in backend/.env (remove or fix a conflicting machine-level DATABASE_URL), and try again.',
            });
        }
        const dev = process.env.NODE_ENV !== 'production';
        return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Internal Server Error',
            message: 'Database request failed',
            ...(dev && { prismaCode: exception.code }),
        });
    }
};
exports.PrismaKnownRequestExceptionFilter = PrismaKnownRequestExceptionFilter;
exports.PrismaKnownRequestExceptionFilter = PrismaKnownRequestExceptionFilter = __decorate([
    (0, common_1.Catch)(client_1.Prisma.PrismaClientKnownRequestError)
], PrismaKnownRequestExceptionFilter);
//# sourceMappingURL=prisma-exception.filter.js.map