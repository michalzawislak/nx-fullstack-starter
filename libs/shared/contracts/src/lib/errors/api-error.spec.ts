import { apiErrorSchema, isApiError, parseApiError } from './api-error';

describe('apiErrorSchema', () => {
  it('accepts an error with field details', () => {
    // Arrange
    const body = {
      statusCode: 400,
      errorCode: 'VALIDATION_FAILED',
      message: 'Validation failed',
      details: { email: ['Invalid email address'] },
    };

    // Act
    const result = apiErrorSchema.safeParse(body);

    // Assert
    expect(result.success).toBe(true);
  });

  it.each([
    [
      'a success status',
      { statusCode: 200, errorCode: 'INTERNAL_ERROR', message: 'x' },
    ],
    ['a missing message', { statusCode: 500, errorCode: 'INTERNAL_ERROR' }],
    [
      'details that are not string arrays',
      {
        statusCode: 400,
        errorCode: 'VALIDATION_FAILED',
        message: 'x',
        details: { email: 'bad' },
      },
    ],
  ])('rejects %s', (_case, body) => {
    // Act
    const result = apiErrorSchema.safeParse(body);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('isApiError', () => {
  it('recognises an ApiError and rejects other values', () => {
    // Arrange
    const apiError = {
      statusCode: 409,
      errorCode: 'EMAIL_TAKEN',
      message: 'Email taken',
    };

    // Act & Assert
    expect(isApiError(apiError)).toBe(true);
    expect(isApiError(new Error('boom'))).toBe(false);
    expect(isApiError(null)).toBe(false);
  });
});

describe('parseApiError', () => {
  it('returns a valid ApiError without unknown fields (CON-7)', () => {
    // Arrange
    const body = {
      statusCode: 401,
      errorCode: 'TOKEN_EXPIRED',
      message: 'Token expired',
      traceId: 'abc',
    };

    // Act
    const apiError = parseApiError(body, 401);

    // Assert
    expect(apiError).toEqual({
      statusCode: 401,
      errorCode: 'TOKEN_EXPIRED',
      message: 'Token expired',
    });
  });

  it('maps an error code added by a newer API to INTERNAL_ERROR and keeps the rest (CON-5)', () => {
    // Arrange
    const body = {
      statusCode: 402,
      errorCode: 'PAYMENT_REQUIRED',
      message: 'Payment required',
    };

    // Act
    const apiError = parseApiError(body, 402);

    // Assert
    expect(apiError).toEqual({
      statusCode: 402,
      errorCode: 'INTERNAL_ERROR',
      message: 'Payment required',
    });
  });

  it.each([
    [
      'an HTML page from a proxy',
      '<html>Bad gateway</html>',
      502,
      'INTERNAL_ERROR',
    ],
    ['an empty body', null, 429, 'RATE_LIMITED'],
    ['an unrelated JSON object', { error: 'nope' }, 404, 'NOT_FOUND'],
  ] as const)(
    'derives the code from the status for %s',
    (_case, body, httpStatus, expectedCode) => {
      // Act
      const apiError = parseApiError(body, httpStatus);

      // Assert
      expect(apiError.statusCode).toBe(httpStatus);
      expect(apiError.errorCode).toBe(expectedCode);
      expect(apiError.message).toBe('Unexpected response from the server.');
    },
  );
});
