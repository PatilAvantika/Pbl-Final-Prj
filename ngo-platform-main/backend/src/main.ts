import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// Prefer backend/.env over inherited env (e.g. global DATABASE_URL=localhost breaks Neon).
loadEnv({ path: resolve(process.cwd(), '.env'), override: true });
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { randomUUID } from 'crypto';
import { PrismaKnownRequestExceptionFilter } from './prisma/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') || true, credentials: true });
  app.use((req: any, res: any, next: () => void) => {
    const requestId = req.headers['x-request-id'] || randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    const start = Date.now();
    res.on('finish', () => {
      const elapsed = Date.now() - start;
      // Lightweight structured log for observability baselines.
      console.log(
        JSON.stringify({
          requestId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          elapsedMs: elapsed,
        }),
      );
    });
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new PrismaKnownRequestExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
