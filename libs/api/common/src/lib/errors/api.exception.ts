import { HttpException } from '@nestjs/common';

import {
  type ApiError,
  ERROR_CODE_STATUS,
  type ErrorCode,
} from '@starter/shared/contracts';

/** An error that reaches the client as an ApiError (PRD section 8.1). */
export class ApiException extends HttpException {
  readonly errorCode: ErrorCode;
  readonly details: ApiError['details'];

  constructor(
    errorCode: ErrorCode,
    message: string,
    details?: ApiError['details'],
  ) {
    super(message, ERROR_CODE_STATUS[errorCode]);
    this.errorCode = errorCode;
    this.details = details;
  }

  toApiError(): ApiError {
    return {
      statusCode: this.getStatus(),
      errorCode: this.errorCode,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}
