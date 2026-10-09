import * as z from 'zod/mini';

export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 8;
/** Upper bound keeps Argon2id hashing cheap enough to resist denial of service. */
export const PASSWORD_MAX_LENGTH = 128;

/** Email trimmed and lower-cased before validation, so web forms and the API store the same value. */
export const emailSchema = z.pipe(
  z.string().check(z.trim(), z.toLowerCase()),
  z.email().check(z.maxLength(EMAIL_MAX_LENGTH)),
);

/** Password rules for new accounts. */
export const newPasswordSchema = z
  .string()
  .check(z.minLength(PASSWORD_MIN_LENGTH), z.maxLength(PASSWORD_MAX_LENGTH));
