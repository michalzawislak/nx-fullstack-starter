import * as z from 'zod';

/** GET /health: 200 with status ok, 503 with status error when the database does not answer. */
export const healthStatusSchema = z.object({
  status: z.enum(['ok', 'error']),
  uptimeSeconds: z.number().int().nonnegative(),
  /** Added in step 5; optional so older clients and tests stay valid (CON-5). */
  database: z.enum(['up', 'down']).optional(),
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;
