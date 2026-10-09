import * as z from 'zod/mini';

import {
  type AppPlatform,
  type AppVersion,
  appVersionSchema,
} from '@starter/shared/contracts';

/** Web dev server, iOS WebView and Android WebView origins (BE-14). */
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:4200',
  'capacitor://localhost',
  'https://localhost',
];

/** Every app version is supported unless MIN_APP_VERSION_<PLATFORM> says otherwise. */
const NO_MINIMUM_VERSION = '0.0.0';

/** Environment variables are strings: coerce to an integer within bounds. */
const integerVariable = (minimum: number, maximum = Number.MAX_SAFE_INTEGER) =>
  z.pipe(z.coerce.number(), z.int().check(z.gte(minimum), z.lte(maximum)));

const commaSeparatedListSchema = z.pipe(
  z.pipe(
    z.string(),
    z.transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  ),
  z.array(z.string().check(z.minLength(1))).check(z.minLength(1)),
);

/** Every environment variable the API reads (BE-12, BE-13). Keep in sync with .env.example. */
export const environmentSchema = z.object({
  NODE_ENV: z._default(
    z.enum(['development', 'test', 'production']),
    'development',
  ),
  PORT: z._default(integerVariable(1, 65_535), 3000),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  JWT_ACCESS_SECRET: z
    .string()
    .check(z.minLength(32, 'Use at least 32 random characters')),
  JWT_ACCESS_TTL_SECONDS: z._default(integerVariable(1), 900),
  REFRESH_TOKEN_TTL_DAYS: z._default(integerVariable(1), 30),
  CORS_ORIGINS: z._default(commaSeparatedListSchema, DEFAULT_CORS_ORIGINS),
  AUTH_RATE_LIMIT_PER_MINUTE: z._default(integerVariable(1), 20),
  MIN_APP_VERSION_WEB: z.optional(appVersionSchema),
  MIN_APP_VERSION_IOS: z.optional(appVersionSchema),
  MIN_APP_VERSION_ANDROID: z.optional(appVersionSchema),
});

export interface AppConfig {
  readonly environment: 'development' | 'test' | 'production';
  readonly isProduction: boolean;
  readonly port: number;
  readonly databaseUrl: string;
  readonly jwtAccessSecret: string;
  readonly accessTokenTtlSeconds: number;
  readonly refreshTokenTtlDays: number;
  readonly corsOrigins: readonly string[];
  readonly authRateLimitPerMinute: number;
  readonly minimumAppVersions: Readonly<Record<AppPlatform, AppVersion>>;
}

export class InvalidConfigurationError extends Error {
  constructor(readonly problems: readonly string[]) {
    super(
      `Invalid environment configuration:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`,
    );
    this.name = 'InvalidConfigurationError';
  }
}

/** Validates the environment once at startup; a missing or invalid variable stops the API (BE-12). */
export function loadAppConfig(
  environment: Readonly<Record<string, string | undefined>>,
): AppConfig {
  const result = environmentSchema.safeParse(environment);

  if (!result.success) {
    throw new InvalidConfigurationError(
      result.error.issues.map(
        (issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`,
      ),
    );
  }

  const variables = result.data;
  const minimumAppVersions: Record<AppPlatform, AppVersion> = {
    web: variables.MIN_APP_VERSION_WEB ?? NO_MINIMUM_VERSION,
    ios: variables.MIN_APP_VERSION_IOS ?? NO_MINIMUM_VERSION,
    android: variables.MIN_APP_VERSION_ANDROID ?? NO_MINIMUM_VERSION,
  };

  return {
    environment: variables.NODE_ENV,
    isProduction: variables.NODE_ENV === 'production',
    port: variables.PORT,
    databaseUrl: variables.DATABASE_URL,
    jwtAccessSecret: variables.JWT_ACCESS_SECRET,
    accessTokenTtlSeconds: variables.JWT_ACCESS_TTL_SECONDS,
    refreshTokenTtlDays: variables.REFRESH_TOKEN_TTL_DAYS,
    corsOrigins: variables.CORS_ORIGINS,
    authRateLimitPerMinute: variables.AUTH_RATE_LIMIT_PER_MINUTE,
    minimumAppVersions,
  };
}
