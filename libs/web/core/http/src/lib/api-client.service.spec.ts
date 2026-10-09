import { TestBed } from '@angular/core/testing';

import { firstValueFrom } from 'rxjs';

import { API_ENDPOINTS } from '@starter/shared/contracts';

import { ApiClient } from './api-client.service';
import { setupHttpTesting, TEST_API_URL } from './testing.spec-helpers';

describe('ApiClient', () => {
  it('sends the body to the contract path with credentials for auth routes', async () => {
    // Arrange
    const { httpMock } = setupHttpTesting();
    const credentials = {
      email: 'jane@example.com',
      password: 'correct-horse',
    };
    const response = firstValueFrom(
      TestBed.inject(ApiClient).request(API_ENDPOINTS.auth.login, credentials),
    );

    // Act
    const testRequest = httpMock.expectOne(`${TEST_API_URL}/v1/auth/login`);
    testRequest.flush({
      accessToken: 'jwt',
      expiresIn: 900,
      futureField: true,
    });

    // Assert
    expect(testRequest.request.method).toBe('POST');
    expect(testRequest.request.body).toEqual(credentials);
    expect(testRequest.request.withCredentials).toBe(true);
    expect(await response).toEqual({ accessToken: 'jwt', expiresIn: 900 });
  });

  it('sends GET requests without a body or credentials', async () => {
    // Arrange
    const { httpMock } = setupHttpTesting();
    const response = firstValueFrom(
      TestBed.inject(ApiClient).request(API_ENDPOINTS.users.me),
    );
    const user = {
      id: '7b0c6f0e-3c1a-4a51-9a8e-2f0f2a7c9d11',
      email: 'jane@example.com',
      createdAt: '2026-10-09T08:00:00.000Z',
    };

    // Act
    const testRequest = httpMock.expectOne(`${TEST_API_URL}/v1/users/me`);
    testRequest.flush(user);

    // Assert
    expect(testRequest.request.method).toBe('GET');
    expect(testRequest.request.body).toBeNull();
    expect(testRequest.request.withCredentials).toBe(false);
    expect(await response).toEqual(user);
  });

  it('resolves to undefined for endpoints without a response body', async () => {
    // Arrange
    const { httpMock } = setupHttpTesting();
    const response = firstValueFrom(
      TestBed.inject(ApiClient).request(API_ENDPOINTS.auth.logout, {}),
    );

    // Act
    httpMock
      .expectOne(`${TEST_API_URL}/v1/auth/logout`)
      .flush(null, { status: 204, statusText: 'No Content' });

    // Assert
    expect(await response).toBeUndefined();
  });

  it('fails when the response does not match the contract', async () => {
    // Arrange
    const { httpMock } = setupHttpTesting();
    const response = firstValueFrom(
      TestBed.inject(ApiClient).request(API_ENDPOINTS.app.config),
    );

    // Act
    httpMock
      .expectOne(`${TEST_API_URL}/v1/app/config`)
      .flush({ unexpected: true });

    // Assert
    await expect(response).rejects.toThrow();
  });
});
