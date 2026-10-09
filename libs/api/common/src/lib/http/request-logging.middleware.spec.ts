import { EventEmitter } from 'node:events';

import { Logger } from '@nestjs/common';

import type { Request, Response } from 'express';

import {
  REQUEST_ID_HEADER,
  RequestLoggingMiddleware,
} from './request-logging.middleware';

function setup(incomingRequestId?: string) {
  const request = {
    method: 'GET',
    path: '/health',
    header: (name: string) =>
      name === REQUEST_ID_HEADER ? incomingRequestId : undefined,
  } as unknown as Request;
  const response = Object.assign(new EventEmitter(), {
    statusCode: 200,
    setHeader: vi.fn(),
  });
  const logSpy = vi
    .spyOn(Logger.prototype, 'log')
    .mockImplementation(() => undefined);
  return {
    request,
    response: response as unknown as Response & typeof response,
    logSpy,
  };
}

describe('RequestLoggingMiddleware', () => {
  it('keeps an incoming request id and logs the finished request as an object', () => {
    // Arrange
    const { request, response, logSpy } = setup('abc-123');
    const next = vi.fn();

    // Act
    new RequestLoggingMiddleware().use(request, response, next);
    response.emit('finish');

    // Assert
    expect(next).toHaveBeenCalled();
    expect(response.setHeader).toHaveBeenCalledWith(
      REQUEST_ID_HEADER,
      'abc-123',
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'abc-123',
        method: 'GET',
        path: '/health',
        statusCode: 200,
      }),
    );
  });

  it('generates a request id when none or an oversized one is sent', () => {
    // Arrange
    const { request, response } = setup('x'.repeat(500));

    // Act
    new RequestLoggingMiddleware().use(request, response, vi.fn());

    // Assert
    const [, requestId] = response.setHeader.mock.calls[0] ?? [];
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
