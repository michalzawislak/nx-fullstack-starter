import type { ApiError, ErrorCode } from '@starter/shared/contracts';

/** The API answered with an error; components branch on `errorCode` (FE-15). */
export class ApiRequestError extends Error {
  constructor(readonly apiError: ApiError) {
    super(apiError.message);
    this.name = 'ApiRequestError';
  }

  get errorCode(): ErrorCode {
    return this.apiError.errorCode;
  }
}

/** The request never reached the API: offline, DNS, CORS or a timeout (FE-16). */
export class NetworkError extends Error {
  constructor() {
    super('The server could not be reached.');
    this.name = 'NetworkError';
  }
}

export function isApiErrorWithCode(
  error: unknown,
  errorCode: ErrorCode,
): error is ApiRequestError {
  return error instanceof ApiRequestError && error.errorCode === errorCode;
}
