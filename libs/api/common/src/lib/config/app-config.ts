import { z } from 'zod';

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

const commaSeparatedListSchema = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0),
  )
  .pipe(z.array(z.string().min(1)).min(1));

/** Every environment variable the API reads (BE-12, BE-13). Keep in sync with .env.example. */
export const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  JWT_ACCESS_SECRET: z.string().min(32, 'Use at least 32 random characters'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGINS: commaSeparatedListSchema.default(DEFAULT_CORS_ORIGINS),
  AUTH_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(20),
  MIN_APP_VERSION_WEB: appVersionSchema.default('0.0.0'),
  MIN_APP_VERSION_IOS: appVersionSchema.default('0.0.0'),
  MIN_APP_VERSION_ANDROID: appVersionSchema.default('0.0.0'),
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
    web: variables.MIN_APP_VERSION_WEB,
    ios: variables.MIN_APP_VERSION_IOS,
    android: variables.MIN_APP_VERSION_ANDROID,
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
