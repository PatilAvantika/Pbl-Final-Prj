import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

/** Maps Prisma request errors to HTTP responses (avoids opaque 500s for DB connectivity). */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaKnownRequestExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaKnownRequestExceptionFilter.name);

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

    /** DB exists but migrations were not applied (common after pulling new code). */
    const schemaOutOfDate = new Set(['P2021', 'P2022']);
    if (schemaOutOfDate.has(exception.code)) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: 'Service Unavailable',
        message:
          'Database schema is out of date. From the backend folder run: npx prisma migrate deploy',
      });
    }

    /** Unique constraint (e.g. duplicate email on concurrent register). */
    if (exception.code === 'P2002') {
      const target = exception.meta?.target as string[] | string | undefined;
      const fields = Array.isArray(target) ? target : target ? [target] : [];
      const isEmail = fields.some((f) => String(f).toLowerCase().includes('email'));
      return res.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: isEmail
          ? 'An account with this email already exists.'
          : 'This value already exists. Please use a different one.',
      });
    }

    /** Foreign key failed (e.g. orphaned reference). */
    if (exception.code === 'P2003') {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message:
          'Invalid data reference. Ensure database migrations are applied (npx prisma migrate deploy).',
      });
    }

    /** Raw query failed — often enum / constraint mismatch vs. migrated schema (e.g. Role missing DONOR). */
    if (exception.code === 'P2010') {
      this.logger.error(
        `Prisma P2010 meta=${JSON.stringify(exception.meta)} message=${exception.message}`,
        exception.stack,
      );
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message:
          'Database rejected this value. Run migrations: npx prisma migrate deploy (ensure Role enum includes DONOR).',
      });
    }

    /** Null constraint violation (required column missing at DB). */
    if (exception.code === 'P2011') {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Required data is missing. Ensure the API client sends all required fields.',
      });
    }

    const dev = process.env.NODE_ENV !== 'production';
    this.logger.error(
      `Unhandled Prisma error code=${exception.code} meta=${JSON.stringify(exception.meta)} message=${exception.message}`,
      exception.stack,
    );
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: `Database request failed (${exception.code}). From the backend folder run: npx prisma migrate deploy — then restart the API.`,
      ...(dev && { prismaCode: exception.code, prismaMeta: exception.meta }),
    });
  }
}

/** Engine errors without a Prisma error code (e.g. PostgreSQL invalid enum value). */
@Catch(Prisma.PrismaClientUnknownRequestError)
export class PrismaUnknownRequestExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('PrismaUnknownRequestExceptionFilter');

  catch(exception: Prisma.PrismaClientUnknownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    this.logger.error(exception.message, exception.stack);

    const msg = exception.message;
    const enumRole =
      /invalid input value for enum|enum\s+"Role"|Role.*enum/i.test(msg) &&
      /DONOR|role/i.test(msg);

    return res.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      message: enumRole
        ? 'The database does not allow the DONOR role yet. From the backend folder run: npx prisma migrate deploy, then restart the API.'
        : 'Database request could not be completed. From the backend folder run: npx prisma migrate deploy. Check backend logs for details.',
    });
  }
}
