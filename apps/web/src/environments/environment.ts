import type { AppEnvironment } from './app-environment';

/**
 * Local development: `nx serve web` and the `mobile-dev` build for simulators and emulators.
 * Production values (web and the `mobile` build): environment.production.ts (fileReplacements in project.json).
 */
export const environment: AppEnvironment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000',
  // The Android emulator sees the host machine as 10.0.2.2; a physical device needs your LAN IP.
  apiBaseUrlOverrides: { android: 'http://10.0.2.2:3000' },
  appVersion: '0.1.0',
};
