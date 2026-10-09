import * as z from 'zod/mini';

/** GET /health: 200 with status ok, 503 with status error when the database does not answer. */
export const healthStatusSchema = z.object({
  status: z.enum(['ok', 'error']),
  uptimeSeconds: z.int().check(z.nonnegative()),
  /** Added in step 5; optional so older clients and tests stay valid (CON-5). */
  database: z.optional(z.enum(['up', 'down'])),
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;
