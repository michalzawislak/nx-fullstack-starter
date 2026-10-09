import { Global, Module } from '@nestjs/common';

import { type AppConfig, loadAppConfig } from './app-config';

/** Injection token for the validated configuration. */
export const APP_CONFIG = Symbol('APP_CONFIG');

/** The only place that reads process.env (apps/api/AGENTS.md). */
@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: (): AppConfig => loadAppConfig(process.env),
    },
  ],
  exports: [APP_CONFIG],
})
export class ConfigModule {}
