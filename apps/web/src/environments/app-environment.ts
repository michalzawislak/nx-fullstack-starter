import type { AppVersion } from '@starter/shared/contracts';

export interface AppEnvironment {
  readonly production: boolean;
  /** Absolute API origin (FE-12). The web app and the API must share a site for the refresh cookie (BE-4). */
  readonly apiBaseUrl: string;
  /** Sent as X-App-Version; bump it with every release (CON-6). */
  readonly appVersion: AppVersion;
}
