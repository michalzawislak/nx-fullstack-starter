import {
  type EnvironmentProviders,
  InjectionToken,
  makeEnvironmentProviders,
} from '@angular/core';

import type { AppVersion } from '@starter/shared/contracts';

export interface ApiConfig {
  /** Absolute API origin, for example https://api.example.com (FE-12: relative paths fail in WebViews). */
  readonly baseUrl: string;
  /** Sent as X-App-Version (CON-6). */
  readonly appVersion: AppVersion;
}

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG');

const ABSOLUTE_URL = /^https?:\/\//;

export function provideApiConfig(config: ApiConfig): EnvironmentProviders {
  if (!ABSOLUTE_URL.test(config.baseUrl)) {
    throw new Error(
      `API baseUrl must be absolute (FE-12), got "${config.baseUrl}"`,
    );
  }

  return makeEnvironmentProviders([
    {
      provide: API_CONFIG,
      useValue: { ...config, baseUrl: config.baseUrl.replace(/\/+$/, '') },
    },
  ]);
}

/** True for requests to our API; tokens and app headers are never sent anywhere else. */
export function isApiRequest(url: string, config: ApiConfig): boolean {
  return url === config.baseUrl || url.startsWith(`${config.baseUrl}/`);
}
