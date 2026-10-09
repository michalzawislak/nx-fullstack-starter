import * as z from 'zod/mini';

import { errorCodeForStatus, errorCodeSchema } from './error-code';

/** Shape of every API error response (PRD section 8.1). */
export const apiErrorSchema = z.object({
  statusCode: z.int().check(z.gte(400), z.lte(599)),
  errorCode: errorCodeSchema,
  message: z.string(),
  details: z.optional(z.record(z.string(), z.array(z.string()))),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

const apiErrorWithAnyCodeSchema = z.extend(apiErrorSchema, {
  errorCode: z.string(),
});

const UNEXPECTED_RESPONSE_MESSAGE = 'Unexpected response from the server.';

export function isApiError(value: unknown): value is ApiError {
  return apiErrorSchema.safeParse(value).success;
}

/**
 * Turns any error response body into an ApiError.
 * - A valid ApiError is returned as is (unknown extra fields are dropped, CON-7).
 * - An error code this client does not know yet (added by a newer API, CON-5) becomes INTERNAL_ERROR
 *   while the status, message and details are kept.
 * - Any other body (proxy HTML, empty body) gets a code derived from the HTTP status.
 */
export function parseApiError(body: unknown, httpStatus: number): ApiError {
  const knownError = apiErrorSchema.safeParse(body);

  if (knownError.success) {
    return knownError.data;
  }

  const errorWithUnknownCode = apiErrorWithAnyCodeSchema.safeParse(body);

  if (errorWithUnknownCode.success) {
    return { ...errorWithUnknownCode.data, errorCode: 'INTERNAL_ERROR' };
  }

  return {
    statusCode: httpStatus,
    errorCode: errorCodeForStatus(httpStatus),
    message: UNEXPECTED_RESPONSE_MESSAGE,
  };
}
