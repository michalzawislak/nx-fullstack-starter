import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';

import type { Response } from 'express';

import { type ApiError, errorCodeForStatus } from '@starter/shared/contracts';

import { ApiException } from './api.exception';

const INTERNAL_ERROR_MESSAGE = 'Internal server error';

/** Turns every thrown error into an ApiError response (PRD section 8.1). */
export function toApiError(exception: unknown): ApiError {
  if (exception instanceof ApiException) {
    return exception.toApiError();
  }

  if (exception instanceof HttpException) {
    const statusCode = exception.getStatus();
    const errorCode = errorCodeForStatus(statusCode);

    return {
      statusCode,
      errorCode,
      message:
        errorCode === 'INTERNAL_ERROR'
          ? INTERNAL_ERROR_MESSAGE
          : exception.message,
    };
  }

  return {
    statusCode: 500,
    errorCode: 'INTERNAL_ERROR',
    message: INTERNAL_ERROR_MESSAGE,
  };
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const apiError = toApiError(exception);

    if (apiError.statusCode >= 500) {
      this.logger.error(
        exception instanceof Error
          ? (exception.stack ?? exception.message)
          : String(exception),
      );
    }

    response.status(apiError.statusCode).json(apiError);
  }
}
