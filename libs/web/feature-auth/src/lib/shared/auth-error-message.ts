import { ApiRequestError, NetworkError } from '@starter/web/core/http';

/** User-facing message for a failed login or registration; decided by errorCode, never by the API message (FE-15). */
export function authErrorMessage(error: unknown): string {
  if (error instanceof NetworkError) {
    return 'You are offline. Check your connection and try again.';
  }

  if (error instanceof ApiRequestError) {
    switch (error.errorCode) {
      case 'INVALID_CREDENTIALS':
        return 'Incorrect email or password.';
      case 'EMAIL_TAKEN':
        return 'An account with this email already exists. Sign in instead.';
      case 'RATE_LIMITED':
        return 'Too many attempts. Wait a minute and try again.';
      case 'VALIDATION_FAILED':
        return 'Check the highlighted fields.';
      default:
        break;
    }
  }

  return 'Something went wrong. Try again.';
}

/** Only same-app paths are allowed as return URLs, so a crafted link cannot redirect elsewhere. */
export function safeReturnUrl(returnUrl: string | null | undefined): string {
  return returnUrl?.startsWith('/') && !returnUrl.startsWith('//')
    ? returnUrl
    : '/';
}
