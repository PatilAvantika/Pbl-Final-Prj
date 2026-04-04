"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const path_1 = require("path");
(0, dotenv_1.config)({ path: (0, path_1.resolve)(process.cwd(), '.env'), override: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const crypto_1 = require("crypto");
const prisma_exception_filter_1 = require("./prisma/prisma-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') || true, credentials: true });
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
    app.useGlobalFilters(new prisma_exception_filter_1.PrismaKnownRequestExceptionFilter());
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map