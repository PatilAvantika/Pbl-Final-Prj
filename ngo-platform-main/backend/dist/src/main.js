"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const path_1 = require("path");
(0, dotenv_1.config)({ path: (0, path_1.resolve)(process.cwd(), '.env'), override: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const express_1 = require("express");
const app_module_1 = require("./app.module");
const crypto_1 = require("crypto");
const prisma_exception_filter_1 = require("./prisma/prisma-exception.filter");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bodyParser: false,
    });
    app.use((0, express_1.json)({ limit: '32mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '32mb' }));
    app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
    app.use((0, cookie_parser_1.default)());
    const corsOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean);
    app.enableCors({
        origin: corsOrigins?.length ? corsOrigins : true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    });
    app.use((req, res, next) => {
        const requestId = req.headers['x-request-id'] || (0, crypto_1.randomUUID)();
        req.requestId = requestId;
        res.setHeader('x-request-id', requestId);
        const start = Date.now();
        res.on('finish', () => {
            const elapsed = Date.now() - start;
            console.log(JSON.stringify({
                requestId,
                method: req.method,
                path: req.originalUrl,
                statusCode: res.statusCode,
                elapsedMs: elapsed,
            }));
        });
        next();
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new prisma_exception_filter_1.PrismaUnknownRequestExceptionFilter(), new prisma_exception_filter_1.PrismaKnownRequestExceptionFilter());
    app.setGlobalPrefix('api/v1', {
        exclude: [
            { path: 'health', method: common_1.RequestMethod.GET },
            { path: 'ready', method: common_1.RequestMethod.GET },
        ],
    });
    const port = Number(process.env.PORT) || 3000;
    try {
        await app.listen(port);
        console.log(`API listening on http://localhost:${port}`);
    }
    catch (err) {
        const e = err;
        if (e?.code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use (another backend instance?). Close that terminal/process, or set PORT to a free port in backend/.env (e.g. PORT=3002). On Windows: netstat -ano | findstr :${port} then taskkill /PID <pid> /F`);
            process.exit(1);
        }
        throw err;
    }
}
bootstrap();
//# sourceMappingURL=main.js.map