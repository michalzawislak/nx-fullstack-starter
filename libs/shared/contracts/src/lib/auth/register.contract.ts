import * as z from 'zod/mini';

import { emailSchema, newPasswordSchema } from './credentials';

export const registerRequestSchema = z.object({
  email: emailSchema,
  password: newPasswordSchema,
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
