import { z } from 'zod';

/** GET /health. The database check is added in step 5 as an additive field. */
export const healthStatusSchema = z.object({
  status: z.enum(['ok', 'error']),
  uptimeSeconds: z.number().int().nonnegative(),
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;
