import {
  appPlatformSchema,
  appVersionSchema,
  isVersionSupported,
} from './app-headers';

describe('appVersionSchema', () => {
  it.each(['1.0.0', '0.0.1', '10.20.30'])('accepts %s', (version) => {
    // Act
    const result = appVersionSchema.safeParse(version);

    // Assert
    expect(result.success).toBe(true);
  });

  it.each(['1.0', '1.0.0-beta', 'v1.0.0', '', '1.0.0.0'])(
    'rejects "%s"',
    (version) => {
      // Act
      const result = appVersionSchema.safeParse(version);

      // Assert
      expect(result.success).toBe(false);
    },
  );
});

describe('appPlatformSchema', () => {
  it('accepts only web, ios and android', () => {
    // Act
    const results = ['web', 'ios', 'android', 'windows'].map(
      (platform) => appPlatformSchema.safeParse(platform).success,
    );

    // Assert
    expect(results).toEqual([true, true, true, false]);
  });
});

describe('isVersionSupported', () => {
  it.each([
    ['1.2.3', '1.2.3', true],
    ['1.2.4', '1.2.3', true],
    ['1.10.0', '1.9.9', true],
    ['2.0.0', '1.99.99', true],
    ['1.2.2', '1.2.3', false],
    ['1.9.9', '1.10.0', false],
    ['0.9.0', '1.0.0', false],
  ] as const)(
    'current %s with minimum %s gives %s',
    (currentVersion, minimumVersion, expected) => {
      // Act
      const isSupported = isVersionSupported(currentVersion, minimumVersion);

      // Assert
      expect(isSupported).toBe(expected);
    },
  );
});
