import { TestBed } from '@angular/core/testing';

import { API_CONFIG, isApiRequest, provideApiConfig } from './api-config';

describe('provideApiConfig', () => {
  it('rejects a relative base URL (FE-12)', () => {
    // Act
    const provide = () =>
      provideApiConfig({ baseUrl: '/api', appVersion: '1.0.0' });

    // Assert
    expect(provide).toThrow('must be absolute');
  });

  it('removes trailing slashes from the base URL', () => {
    // Arrange
    TestBed.configureTestingModule({
      providers: [
        provideApiConfig({
          baseUrl: 'https://api.test//',
          appVersion: '1.0.0',
        }),
      ],
    });

    // Act
    const config = TestBed.inject(API_CONFIG);

    // Assert
    expect(config.baseUrl).toBe('https://api.test');
  });
});

describe('isApiRequest', () => {
  const config = { baseUrl: 'https://api.test', appVersion: '1.0.0' } as const;

  it.each([
    ['https://api.test/v1/users/me', true],
    ['https://api.test', true],
    ['https://api.test.evil.com/v1', false],
    ['https://cdn.example.com/logo.png', false],
  ])('%s gives %s', (url, expected) => {
    // Act & Assert
    expect(isApiRequest(url, config)).toBe(expected);
  });
});
