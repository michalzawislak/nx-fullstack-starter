import { appConfigSchema } from './app-config.contract';

describe('appConfigSchema', () => {
  it('accepts a minimum version for every platform', () => {
    // Act
    const result = appConfigSchema.safeParse({
      minimumSupportedVersions: {
        web: '1.0.0',
        ios: '1.2.0',
        android: '1.1.0',
      },
    });

    // Assert
    expect(result.success).toBe(true);
  });

  it.each([
    ['a missing platform', { web: '1.0.0', ios: '1.0.0' }],
    [
      'an unknown platform',
      { web: '1.0.0', ios: '1.0.0', android: '1.0.0', windows: '1.0.0' },
    ],
    ['an invalid version', { web: 'latest', ios: '1.0.0', android: '1.0.0' }],
  ])('rejects %s', (_case, minimumSupportedVersions) => {
    // Act
    const result = appConfigSchema.safeParse({ minimumSupportedVersions });

    // Assert
    expect(result.success).toBe(false);
  });
});
