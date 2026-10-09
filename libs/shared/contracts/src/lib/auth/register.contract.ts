import * as z from 'zod';

import { emailSchema, newPasswordSchema } from './credentials';

export const registerRequestSchema = z.object({
  email: emailSchema,
  password: newPasswordSchema,
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
