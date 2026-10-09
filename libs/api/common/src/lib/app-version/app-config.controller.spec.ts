import type { AppConfig } from '../config/app-config';
import { AppConfigController } from './app-config.controller';

describe('AppConfigController', () => {
  it('publishes the minimum version per platform', () => {
    // Arrange
    const config = {
      minimumAppVersions: { web: '1.0.0', ios: '2.0.0', android: '1.5.0' },
    } as AppConfig;

    // Act
    const appConfig = new AppConfigController(config).getConfig();

    // Assert
    expect(appConfig).toEqual({
      minimumSupportedVersions: {
        web: '1.0.0',
        ios: '2.0.0',
        android: '1.5.0',
      },
    });
  });
});
