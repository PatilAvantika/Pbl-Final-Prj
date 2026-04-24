import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// Prefer backend/.env over inherited env (e.g. global DATABASE_URL=localhost breaks Neon).
loadEnv({ path: resolve(process.cwd(), '.env'), override: true });
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { randomUUID } from 'crypto';
import {
  PrismaKnownRequestExceptionFilter,
  PrismaUnknownRequestExceptionFilter,
} from './prisma/prisma-exception.filter';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

console.log("OPENAI KEY:", process.env.OPENAI_API_KEY ? "Loaded" : "Missing");

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  // Default ~100kb is too small for onboarding face samples (multiple JPEG data URLs).
  app.use(json({ limit: '32mb' }));
  app.use(urlencoded({ extended: true, limit: '32mb' }));
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());
  const corsOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors({
    origin: corsOrigins?.length ? corsOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  });
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
  app.useGlobalFilters(
    new PrismaUnknownRequestExceptionFilter(),
    new PrismaKnownRequestExceptionFilter(),
  );
  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'ready', method: RequestMethod.GET },
    ],
  });
  const port = Number(process.env.PORT) || 3000;
  try {
    await app.listen(port);
    console.log(`API listening on http://localhost:${port}`);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === 'EADDRINUSE') {
      console.error(
        `Port ${port} is already in use (another backend instance?). Close that terminal/process, or set PORT to a free port in backend/.env (e.g. PORT=3002). On Windows: netstat -ano | findstr :${port} then taskkill /PID <pid> /F`,
      );
      process.exit(1);
    }
    throw err;
  }
}
bootstrap();
