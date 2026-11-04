import { type ApiErrorResponse } from '@care/api-contracts';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { type Request, type Response } from 'express';

/**
 * Filtro global: toda respuesta de error sigue el contrato ApiErrorResponse.
 * - Errores HTTP controlados: se devuelve su mensaje.
 * - Errores inesperados: 500 genérico. El detalle solo se registra en el log del
 *   servidor (sin cuerpo de petición, cabeceras ni tokens) y nunca se envía al cliente.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    // Sin query string: puede contener datos sensibles.
    const path = (request.originalUrl ?? request.url).split('?')[0] ?? '/';

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const body: ApiErrorResponse = {
      statusCode: status,
      error: HttpStatus[status] ?? 'Error',
      message: this.isUnmatchedRoute(exception, request.method)
        ? 'Ruta no encontrada'
        : this.resolveMessage(exception, status),
      path,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      const error = exception instanceof Error ? exception : new Error('Excepción no estándar');
      this.logger.error(
        `${request.method} ${path} -> ${status}: ${error.name}: ${error.message}`,
        error.stack,
      );
    }

    if (!response.headersSent) {
      response.status(status).json(body);
    }
  }

  /**
   * El 404 por defecto del router ("Cannot GET /ruta?query") repite la URL completa,
   * que podría contener datos sensibles en la query string; se reemplaza por un mensaje genérico.
   */
  private isUnmatchedRoute(exception: unknown, method: string): boolean {
    return (
      exception instanceof NotFoundException && exception.message.startsWith(`Cannot ${method} `)
    );
  }

  private resolveMessage(exception: unknown, status: number): string | string[] {
    if (!(exception instanceof HttpException) || status >= 500) {
      return 'Error interno del servidor';
    }
    const payload = exception.getResponse();
    if (typeof payload === 'string') return payload;
    if (payload && typeof payload === 'object' && 'message' in payload) {
      const message = (payload as { message: unknown }).message;
      if (typeof message === 'string') return message;
      if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
        return message;
      }
    }
    return exception.message;
  }
}
