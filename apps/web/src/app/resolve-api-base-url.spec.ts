import type { AppEnvironment } from '../environments/app-environment';

import { resolveApiBaseUrl } from './resolve-api-base-url';

describe('resolveApiBaseUrl', () => {
  const environment: AppEnvironment = {
    production: false,
    apiBaseUrl: 'http://localhost:3000',
    apiBaseUrlOverrides: { android: 'http://10.0.2.2:3000' },
    appVersion: '0.1.0',
  };

  it('uses the override for its platform', () => {
    // Arrange, Act
    const baseUrl = resolveApiBaseUrl(environment, 'android');

    // Assert
    expect(baseUrl).toBe('http://10.0.2.2:3000');
  });

  it('falls back to the default origin', () => {
    // Arrange, Act
    const webBaseUrl = resolveApiBaseUrl(environment, 'web');
    const iosBaseUrl = resolveApiBaseUrl(
      { ...environment, apiBaseUrlOverrides: undefined },
      'ios',
    );

    // Assert
    expect(webBaseUrl).toBe('http://localhost:3000');
    expect(iosBaseUrl).toBe('http://localhost:3000');
  });
});
