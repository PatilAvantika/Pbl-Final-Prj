"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PrismaKnownRequestExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaUnknownRequestExceptionFilter = exports.PrismaKnownRequestExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaKnownRequestExceptionFilter = PrismaKnownRequestExceptionFilter_1 = class PrismaKnownRequestExceptionFilter {
    logger = new common_1.Logger(PrismaKnownRequestExceptionFilter_1.name);
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
        const schemaOutOfDate = new Set(['P2021', 'P2022']);
        if (schemaOutOfDate.has(exception.code)) {
            return res.status(common_1.HttpStatus.SERVICE_UNAVAILABLE).json({
                statusCode: common_1.HttpStatus.SERVICE_UNAVAILABLE,
                error: 'Service Unavailable',
                message: 'Database schema is out of date. From the backend folder run: npx prisma migrate deploy',
            });
        }
        if (exception.code === 'P2002') {
            const target = exception.meta?.target;
            const fields = Array.isArray(target) ? target : target ? [target] : [];
            const isEmail = fields.some((f) => String(f).toLowerCase().includes('email'));
            return res.status(common_1.HttpStatus.CONFLICT).json({
                statusCode: common_1.HttpStatus.CONFLICT,
                error: 'Conflict',
                message: isEmail
                    ? 'An account with this email already exists.'
                    : 'This value already exists. Please use a different one.',
            });
        }
        if (exception.code === 'P2003') {
            return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                error: 'Bad Request',
                message: 'Invalid data reference. Ensure database migrations are applied (npx prisma migrate deploy).',
            });
        }
        if (exception.code === 'P2010') {
            this.logger.error(`Prisma P2010 meta=${JSON.stringify(exception.meta)} message=${exception.message}`, exception.stack);
            return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                error: 'Bad Request',
                message: 'Database rejected this value. Run migrations: npx prisma migrate deploy (ensure Role enum includes DONOR).',
            });
        }
        if (exception.code === 'P2011') {
            return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                error: 'Bad Request',
                message: 'Required data is missing. Ensure the API client sends all required fields.',
            });
        }
        const dev = process.env.NODE_ENV !== 'production';
        this.logger.error(`Unhandled Prisma error code=${exception.code} meta=${JSON.stringify(exception.meta)} message=${exception.message}`, exception.stack);
        return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Internal Server Error',
            message: `Database request failed (${exception.code}). From the backend folder run: npx prisma migrate deploy — then restart the API.`,
            ...(dev && { prismaCode: exception.code, prismaMeta: exception.meta }),
        });
    }
};
exports.PrismaKnownRequestExceptionFilter = PrismaKnownRequestExceptionFilter;
exports.PrismaKnownRequestExceptionFilter = PrismaKnownRequestExceptionFilter = PrismaKnownRequestExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(client_1.Prisma.PrismaClientKnownRequestError)
], PrismaKnownRequestExceptionFilter);
let PrismaUnknownRequestExceptionFilter = class PrismaUnknownRequestExceptionFilter {
    logger = new common_1.Logger('PrismaUnknownRequestExceptionFilter');
    catch(exception, host) {
        const res = host.switchToHttp().getResponse();
        this.logger.error(exception.message, exception.stack);
        const msg = exception.message;
        const enumRole = /invalid input value for enum|enum\s+"Role"|Role.*enum/i.test(msg) &&
            /DONOR|role/i.test(msg);
        return res.status(common_1.HttpStatus.BAD_REQUEST).json({
            statusCode: common_1.HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            message: enumRole
                ? 'The database does not allow the DONOR role yet. From the backend folder run: npx prisma migrate deploy, then restart the API.'
                : 'Database request could not be completed. From the backend folder run: npx prisma migrate deploy. Check backend logs for details.',
        });
    }
};
exports.PrismaUnknownRequestExceptionFilter = PrismaUnknownRequestExceptionFilter;
exports.PrismaUnknownRequestExceptionFilter = PrismaUnknownRequestExceptionFilter = __decorate([
    (0, common_1.Catch)(client_1.Prisma.PrismaClientUnknownRequestError)
], PrismaUnknownRequestExceptionFilter);
//# sourceMappingURL=prisma-exception.filter.js.map