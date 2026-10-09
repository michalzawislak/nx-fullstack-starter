import type { ExecutionContext } from '@nestjs/common';

import type { AppConfig } from '../config/app-config';
import { ApiException } from '../errors/api.exception';
import { AppVersionGuard } from './app-version.guard';

const config = {
  minimumAppVersions: { web: '1.0.0', ios: '2.0.0', android: '1.5.0' },
} as AppConfig;

const contextWithHeaders = (
  headers: Record<string, string>,
): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        header: (name: string) => headers[name.toLowerCase()],
      }),
    }),
  }) as unknown as ExecutionContext;

describe('AppVersionGuard', () => {
  const guard = new AppVersionGuard(config);

  it.each([
    ['no version header', {}],
    ['an invalid version header', { 'x-app-version': 'dev' }],
    [
      'a supported iOS version',
      { 'x-app-version': '2.0.0', 'x-app-platform': 'ios' },
    ],
    ['a supported web version without platform', { 'x-app-version': '1.0.0' }],
  ])('lets through a request with %s', (_case, headers) => {
    // Act
    const canActivate = guard.canActivate(contextWithHeaders(headers));

    // Assert
    expect(canActivate).toBe(true);
  });

  it('rejects an iOS version below the minimum with APP_VERSION_UNSUPPORTED', () => {
    // Arrange
    const context = contextWithHeaders({
      'x-app-version': '1.9.9',
      'x-app-platform': 'ios',
    });

    // Act
    const check = (): boolean => guard.canActivate(context);

    // Assert
    expect(check).toThrow(ApiException);
    expect(() => check()).toThrow(
      expect.objectContaining({ errorCode: 'APP_VERSION_UNSUPPORTED' }),
    );
  });
});
