import * as z from 'zod/mini';

/** Headers sent by every client request (FE-13, CON-6). */
export const APP_HEADERS = {
  version: 'X-App-Version',
  platform: 'X-App-Platform',
} as const;

export const APP_PLATFORMS = ['web', 'ios', 'android'] as const;

export const appPlatformSchema = z.enum(APP_PLATFORMS);

export type AppPlatform = z.infer<typeof appPlatformSchema>;

/** Application version in `major.minor.patch` form. */
export const appVersionSchema = z
  .string()
  .check(
    z.regex(/^\d+\.\d+\.\d+$/, 'Expected a version in major.minor.patch form'),
  );

export type AppVersion = z.infer<typeof appVersionSchema>;

const toVersionParts = (version: AppVersion): readonly number[] =>
  version.split('.').map((part) => Number.parseInt(part, 10));

/** Returns true when `currentVersion` is equal to or newer than `minimumVersion`. */
export function isVersionSupported(
  currentVersion: AppVersion,
  minimumVersion: AppVersion,
): boolean {
  const currentParts = toVersionParts(currentVersion);
  const minimumParts = toVersionParts(minimumVersion);

  for (let index = 0; index < minimumParts.length; index += 1) {
    const difference = (currentParts[index] ?? 0) - (minimumParts[index] ?? 0);

    if (difference !== 0) {
      return difference > 0;
    }
  }

  return true;
}
