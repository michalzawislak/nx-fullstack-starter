import { detectAppPlatform } from './detect-app-platform';

const capacitor = vi.hoisted(() => ({ platform: 'web' }));

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => capacitor.platform },
}));

describe('detectAppPlatform', () => {
  it.each([
    ['ios', 'ios'],
    ['android', 'android'],
    ['web', 'web'],
    ['electron', 'web'],
  ])('maps the Capacitor platform %s to %s', (capacitorPlatform, expected) => {
    // Arrange
    capacitor.platform = capacitorPlatform;

    // Act
    const platform = detectAppPlatform();

    // Assert
    expect(platform).toBe(expected);
  });
});
