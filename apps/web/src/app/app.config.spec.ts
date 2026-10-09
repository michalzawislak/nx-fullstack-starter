import { TestBed } from '@angular/core/testing';

import { SessionService } from '@starter/web/core/auth';
import { API_CONFIG } from '@starter/web/core/http';
import { PLATFORM_INFO } from '@starter/web/core/platform';

import { environment } from '../environments/environment';

import { appConfig } from './app.config';

describe('appConfig', () => {
  it('wires platform, API configuration and session', () => {
    // Arrange
    TestBed.configureTestingModule({ providers: appConfig.providers });

    // Act
    const apiConfig = TestBed.inject(API_CONFIG);

    // Assert
    expect(apiConfig.baseUrl).toBe(environment.apiBaseUrl);
    expect(TestBed.inject(PLATFORM_INFO).platform()).toBe('web');
    expect(TestBed.inject(SessionService).status()).toBe('unknown');
  });
});
