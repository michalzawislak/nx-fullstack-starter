import { resolveAppPlatform } from './app-platform';

const requestWithPlatform = (platform: string | undefined) => ({
  header: (name: string): string | undefined =>
    name === 'X-App-Platform' ? platform : undefined,
});

describe('resolveAppPlatform', () => {
  it.each([
    ['ios', 'ios'],
    ['Android', 'android'],
    [undefined, 'web'],
    ['windows', 'web'],
  ] as const)('maps %s to %s', (header, expected) => {
    // Act
    const platform = resolveAppPlatform(requestWithPlatform(header) as never);

    // Assert
    expect(platform).toBe(expected);
  });
});
