import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Prisma } from '@prisma/client';
export declare class PrismaKnownRequestExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): any;
}
export declare class PrismaUnknownRequestExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: Prisma.PrismaClientUnknownRequestError, host: ArgumentsHost): any;
}
