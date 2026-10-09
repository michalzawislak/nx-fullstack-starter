import * as z from 'zod/mini';

/** Native apps send the refresh token in the body; the web sends none and relies on the cookie (BE-4). */
export const refreshRequestSchema = z.object({
  refreshToken: z.optional(z.string().check(z.minLength(1))),
});

export type RefreshRequest = z.infer<typeof refreshRequestSchema>;

/** Logout invalidates the current refresh token, delivered the same way as for refresh. */
export const logoutRequestSchema = refreshRequestSchema;

export type LogoutRequest = z.infer<typeof logoutRequestSchema>;
