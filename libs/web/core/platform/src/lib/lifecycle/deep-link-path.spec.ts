import { deepLinkPath } from './deep-link-path';

describe('deepLinkPath', () => {
  it.each([
    ['https://app.example.com/account?tab=1#top', '/account?tab=1#top'],
    ['https://app.example.com', '/'],
    ['com.example.starter://account/settings?tab=1', '/account/settings?tab=1'],
    ['com.example.starter://', '/'],
  ])('maps %s to %s', (url, expectedPath) => {
    // Arrange, Act
    const path = deepLinkPath(url);

    // Assert
    expect(path).toBe(expectedPath);
  });

  it('returns null for a URL that cannot be parsed', () => {
    // Arrange, Act
    const path = deepLinkPath('not a url');

    // Assert
    expect(path).toBeNull();
  });
});
