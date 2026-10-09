import {
  ERROR_CODE_STATUS,
  ERROR_CODES,
  errorCodeForStatus,
} from './error-code';

describe('ERROR_CODE_STATUS', () => {
  it('assigns the HTTP status from PRD section 8.1', () => {
    // Arrange & Act
    const statuses = ERROR_CODE_STATUS;

    // Assert
    expect(statuses).toMatchObject({
      VALIDATION_FAILED: 400,
      INVALID_CREDENTIALS: 401,
      TOKEN_EXPIRED: 401,
      REFRESH_TOKEN_INVALID: 401,
      EMAIL_TAKEN: 409,
      APP_VERSION_UNSUPPORTED: 426,
      RATE_LIMITED: 429,
      INTERNAL_ERROR: 500,
    });
  });

  it('has a status for every error code', () => {
    // Act
    const codesWithStatus = Object.keys(ERROR_CODE_STATUS).sort();

    // Assert
    expect(codesWithStatus).toEqual([...ERROR_CODES].sort());
  });
});

describe('errorCodeForStatus', () => {
  it.each([
    [400, 'VALIDATION_FAILED'],
    [422, 'VALIDATION_FAILED'],
    [401, 'UNAUTHENTICATED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [426, 'APP_VERSION_UNSUPPORTED'],
    [429, 'RATE_LIMITED'],
    [500, 'INTERNAL_ERROR'],
    [502, 'INTERNAL_ERROR'],
    [418, 'INTERNAL_ERROR'],
  ] as const)('maps %i to %s', (statusCode, expectedCode) => {
    // Act
    const errorCode = errorCodeForStatus(statusCode);

    // Assert
    expect(errorCode).toBe(expectedCode);
  });
});
