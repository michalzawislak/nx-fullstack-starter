import { z } from 'zod';

import { appPlatformSchema, appVersionSchema } from '../api/app-headers';

/** Minimum supported app version per platform (CON-6, MOB-11). */
export const appConfigSchema = z.object({
  minimumSupportedVersions: z.record(appPlatformSchema, appVersionSchema),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
