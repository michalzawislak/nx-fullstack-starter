import { z } from 'zod';

/**
 * Tokens returned by register, login and refresh.
 * `refreshToken` is present only for native apps; the web receives it as an httpOnly cookie (BE-4).
 */
export const tokenPairSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).optional(),
  /** Access token lifetime in seconds. */
  expiresIn: z.number().int().positive(),
});

export type TokenPair = z.infer<typeof tokenPairSchema>;
