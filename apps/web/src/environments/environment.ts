import type { AppEnvironment } from './app-environment';

/** Local development. Production values: environment.production.ts (fileReplacements in project.json). */
export const environment: AppEnvironment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000',
  appVersion: '0.1.0',
};
