import * as z from 'zod/mini';

/**
 * Tokens returned by register, login and refresh.
 * `refreshToken` is present only for native apps; the web receives it as an httpOnly cookie (BE-4).
 */
export const tokenPairSchema = z.object({
  accessToken: z.string().check(z.minLength(1)),
  refreshToken: z.optional(z.string().check(z.minLength(1))),
  /** Access token lifetime in seconds. */
  expiresIn: z.int().check(z.positive()),
});

export type TokenPair = z.infer<typeof tokenPairSchema>;
