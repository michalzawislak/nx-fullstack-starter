import type { AppEnvironment } from './app-environment';

/** Production web build. Replace apiBaseUrl with the real API origin of the app built on the starter. */
export const environment: AppEnvironment = {
  production: true,
  apiBaseUrl: 'https://api.example.com',
  appVersion: '0.1.0',
};
