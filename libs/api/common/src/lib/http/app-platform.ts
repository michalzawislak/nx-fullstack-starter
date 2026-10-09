import type { Request } from 'express';

import {
  APP_HEADERS,
  type AppPlatform,
  appPlatformSchema,
} from '@starter/shared/contracts';

/** Platform from the X-App-Platform header; requests without a valid header count as web. */
export function resolveAppPlatform(
  request: Pick<Request, 'header'>,
): AppPlatform {
  const result = appPlatformSchema.safeParse(
    request.header(APP_HEADERS.platform)?.toLowerCase(),
  );
  return result.success ? result.data : 'web';
}
