import { InvalidConfigurationError, loadAppConfig } from './app-config';

const validEnvironment = {
  DATABASE_URL: 'postgresql://starter:starter@localhost:5432/starter',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
};

describe('loadAppConfig', () => {
  it('applies defaults for optional variables', () => {
    // Act
    const config = loadAppConfig(validEnvironment);

    // Assert
    expect(config).toMatchObject({
      environment: 'development',
      isProduction: false,
      port: 3000,
      accessTokenTtlSeconds: 900,
      refreshTokenTtlDays: 30,
      corsOrigins: [
        'http://localhost:4200',
        'capacitor://localhost',
        'https://localhost',
      ],
      minimumAppVersions: { web: '0.0.0', ios: '0.0.0', android: '0.0.0' },
    });
  });

  it('parses explicit values', () => {
    // Arrange
    const environment = {
      ...validEnvironment,
      NODE_ENV: 'production',
      API_PORT: '8080',
      PORT: '9000',
      CORS_ORIGINS: ' https://app.example.com , capacitor://localhost ',
      MIN_APP_VERSION_IOS: '2.1.0',
    };

    // Act
    const config = loadAppConfig(environment);

    // Assert
    expect(config.isProduction).toBe(true);
    expect(config.port).toBe(8080);
    expect(config.corsOrigins).toEqual([
      'https://app.example.com',
      'capacitor://localhost',
    ]);
    expect(config.minimumAppVersions.ios).toBe('2.1.0');
  });

  it('falls back to the PORT of a hosting platform', () => {
    // Arrange
    const environment = { ...validEnvironment, PORT: '9000' };

    // Act
    const config = loadAppConfig(environment);

    // Assert
    expect(config.port).toBe(9000);
  });

  it('lists every missing or invalid variable in one error', () => {
    // Arrange
    const environment = {
      DATABASE_URL: 'mysql://localhost/db',
      JWT_ACCESS_SECRET: 'short',
      API_PORT: 'abc',
    };

    // Act
    const loadInvalidConfig = (): unknown => loadAppConfig(environment);

    // Assert
    expect(loadInvalidConfig).toThrow(InvalidConfigurationError);
    try {
      loadInvalidConfig();
    } catch (error: unknown) {
      const problems = (error as InvalidConfigurationError).problems.join('\n');
      expect(problems).toContain('DATABASE_URL');
      expect(problems).toContain('JWT_ACCESS_SECRET');
      expect(problems).toContain('API_PORT');
    }
  });
});
