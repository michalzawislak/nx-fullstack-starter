import { ApiRequestError, NetworkError } from '@starter/web/core/http';

import { authErrorMessage, safeReturnUrl } from './auth-error-message';

const apiError = (
  errorCode:
    | 'INVALID_CREDENTIALS'
    | 'EMAIL_TAKEN'
    | 'RATE_LIMITED'
    | 'VALIDATION_FAILED'
    | 'INTERNAL_ERROR',
) =>
  new ApiRequestError({ statusCode: 400, errorCode, message: 'server text' });

describe('authErrorMessage', () => {
  it.each([
    [apiError('INVALID_CREDENTIALS'), 'Incorrect email or password.'],
    [
      apiError('EMAIL_TAKEN'),
      'An account with this email already exists. Sign in instead.',
    ],
    [
      apiError('RATE_LIMITED'),
      'Too many attempts. Wait a minute and try again.',
    ],
    [apiError('VALIDATION_FAILED'), 'Check the highlighted fields.'],
    [apiError('INTERNAL_ERROR'), 'Something went wrong. Try again.'],
    [
      new NetworkError(),
      'You are offline. Check your connection and try again.',
    ],
    [new Error('unexpected'), 'Something went wrong. Try again.'],
  ])('maps %o by errorCode, never by the server message', (error, expected) => {
    // Act & Assert
    expect(authErrorMessage(error)).toBe(expected);
  });
});

describe('safeReturnUrl', () => {
  it.each([
    ['/account', '/account'],
    ['/settings?tab=1', '/settings?tab=1'],
    ['//evil.example', '/'],
    ['https://evil.example', '/'],
    [undefined, '/'],
  ])('%s gives %s', (returnUrl, expected) => {
    // Act & Assert
    expect(safeReturnUrl(returnUrl)).toBe(expected);
  });
});
