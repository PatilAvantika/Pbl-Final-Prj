import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

/** Maps Prisma request errors to HTTP responses (avoids opaque 500s for DB connectivity). */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaKnownRequestExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();

    const unreachable = new Set([
      'P1001',
      'P1002',
      'P1003',
      'P1017',
      'P1011',
    ]);
    if (unreachable.has(exception.code)) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: 'Service Unavailable',
        message:
          'Cannot reach the database. If you use Neon: wake the project in the Neon console, confirm DATABASE_URL in backend/.env (remove or fix a conflicting machine-level DATABASE_URL), and try again.',
      });
    }

    const dev = process.env.NODE_ENV !== 'production';
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Database request failed',
      ...(dev && { prismaCode: exception.code }),
    });
  }
}
