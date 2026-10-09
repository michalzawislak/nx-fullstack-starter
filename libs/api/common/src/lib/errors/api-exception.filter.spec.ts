import type { ArgumentsHost } from '@nestjs/common';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ApiException } from './api.exception';
import { ApiExceptionFilter, toApiError } from './api-exception.filter';

describe('toApiError', () => {
  it('keeps code, message and details of an ApiException', () => {
    // Arrange
    const exception = new ApiException(
      'VALIDATION_FAILED',
      'Validation failed',
      { email: ['Invalid'] },
    );

    // Act
    const apiError = toApiError(exception);

    // Assert
    expect(apiError).toEqual({
      statusCode: 400,
      errorCode: 'VALIDATION_FAILED',
      message: 'Validation failed',
      details: { email: ['Invalid'] },
    });
  });

  it.each([
    [new NotFoundException('Cannot GET /x'), 404, 'NOT_FOUND', 'Cannot GET /x'],
    [new BadRequestException('Bad JSON'), 400, 'VALIDATION_FAILED', 'Bad JSON'],
    [
      new HttpException('Too many', HttpStatus.TOO_MANY_REQUESTS),
      429,
      'RATE_LIMITED',
      'Too many',
    ],
    [
      new HttpException('Bad gateway', HttpStatus.BAD_GATEWAY),
      502,
      'INTERNAL_ERROR',
      'Internal server error',
    ],
  ])(
    'maps a framework exception by status',
    (exception, statusCode, errorCode, message) => {
      // Act
      const apiError = toApiError(exception);

      // Assert
      expect(apiError).toEqual({ statusCode, errorCode, message });
    },
  );

  it('hides the details of unexpected errors', () => {
    // Act
    const apiError = toApiError(new Error('connection string with password'));

    // Assert
    expect(apiError).toEqual({
      statusCode: 500,
      errorCode: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  });
});

describe('ApiExceptionFilter', () => {
  it('writes the ApiError with its status and logs server errors', () => {
    // Arrange
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;
    const logSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    // Act
    new ApiExceptionFilter().catch(new Error('boom'), host);

    // Assert
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      errorCode: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
    expect(logSpy).toHaveBeenCalled();
  });
});
