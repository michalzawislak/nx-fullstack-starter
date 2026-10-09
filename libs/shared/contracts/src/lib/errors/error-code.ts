import { z } from 'zod';

/** Machine-readable error codes (PRD section 8.1). Clients react to these, never to messages (FE-15). */
export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'INVALID_CREDENTIALS',
  'TOKEN_EXPIRED',
  'REFRESH_TOKEN_INVALID',
  'FORBIDDEN',
  'NOT_FOUND',
  'EMAIL_TAKEN',
  'APP_VERSION_UNSUPPORTED',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;

export const errorCodeSchema = z.enum(ERROR_CODES);

export type ErrorCode = z.infer<typeof errorCodeSchema>;

/** HTTP status returned with each error code. */
export const ERROR_CODE_STATUS = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  INVALID_CREDENTIALS: 401,
  TOKEN_EXPIRED: 401,
  REFRESH_TOKEN_INVALID: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  EMAIL_TAKEN: 409,
  APP_VERSION_UNSUPPORTED: 426,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
} as const satisfies Record<ErrorCode, number>;

/** Best-effort error code for an HTTP status when the body carries none. */
export function errorCodeForStatus(statusCode: number): ErrorCode {
  switch (statusCode) {
    case 400:
    case 422:
      return 'VALIDATION_FAILED';
    case 401:
      return 'UNAUTHENTICATED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 426:
      return 'APP_VERSION_UNSUPPORTED';
    case 429:
      return 'RATE_LIMITED';
    default:
      return 'INTERNAL_ERROR';
  }
}
