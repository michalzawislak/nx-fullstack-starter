import * as z from 'zod/mini';

import { emailSchema, PASSWORD_MAX_LENGTH } from './credentials';

/**
 * Login accepts any non-empty password up to the maximum length: password rules apply to new
 * passwords only, so accounts created under older rules can still sign in.
 */
export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().check(z.minLength(1), z.maxLength(PASSWORD_MAX_LENGTH)),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
