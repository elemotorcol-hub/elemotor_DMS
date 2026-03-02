import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

/**
 * PrismaExceptionFilter
 * Captura excepciones específicas de Prisma (PrismaClientKnownRequestError)
 * y las mapea a códigos de estado HTTP estándar (400, 404, 409).
 * Esto permite limpiar la lógica de negocio (servicios) evitando
 * bloques try-catch repetitivos.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  // Mapeo unificado de códigos de Prisma a Status HTTP y mensajes
  private readonly errorMapping: Record<
    string,
    { status: HttpStatus; message: string }
  > = {
    P2002: {
      status: HttpStatus.CONFLICT,
      message: 'Unique constraint failed. The resource already exists.',
    },
    P2003: {
      status: HttpStatus.BAD_REQUEST,
      message: 'Foreign key constraint failed. Check your references.',
    },
    P2025: {
      status: HttpStatus.NOT_FOUND,
      message: 'Record to update/delete not found.',
    },
  };

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const mapping = this.errorMapping[exception.code];

    const status = mapping ? mapping.status : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = mapping
      ? mapping.message
      : 'Internal database error';

    // Log the error for debugging
    this.logger.error(
      `[${request.method}] ${request.url} → Prisma Error ${exception.code}`,
      exception.stack,
    );

    // Provide detailed info specifically for P2002 (Unique Constraint) if available
    let errorDetail = message;
    if (exception.code === 'P2002' && exception.meta?.target) {
       errorDetail = `Unique constraint failed on the fields: (${exception.meta.target})`;
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: errorDetail,
      prismaCode: exception.code,
    });
  }
}
