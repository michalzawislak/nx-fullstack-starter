import { randomUUID } from 'node:crypto';

import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';

import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'X-Request-Id';

const MAX_REQUEST_ID_LENGTH = 128;

/** Assigns a request id (or keeps a valid incoming one) and logs every request (BE-16). */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Http');

  use(request: Request, response: Response, next: NextFunction): void {
    const incomingRequestId = request.header(REQUEST_ID_HEADER);
    const requestId =
      incomingRequestId && incomingRequestId.length <= MAX_REQUEST_ID_LENGTH
        ? incomingRequestId
        : randomUUID();
    const startedAt = performance.now();

    response.setHeader(REQUEST_ID_HEADER, requestId);
    response.on('finish', () => {
      this.logger.log({
        requestId,
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        durationMs: Math.round(performance.now() - startedAt),
      });
    });

    next();
  }
}
