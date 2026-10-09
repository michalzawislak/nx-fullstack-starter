import { PasswordHasherService } from './password-hasher.service';

describe('PasswordHasherService', () => {
  const passwordHasher = new PasswordHasherService();

  it('hashes with Argon2id and the OWASP parameters (BE-5)', async () => {
    // Act
    const passwordHash = await passwordHasher.hash('correct-horse');

    // Assert
    expect(passwordHash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  });

  it('verifies the right password and rejects a wrong one', async () => {
    // Arrange
    const passwordHash = await passwordHasher.hash('correct-horse');

    // Act
    const isRight = await passwordHasher.verify(passwordHash, 'correct-horse');
    const isWrong = await passwordHasher.verify(passwordHash, 'battery-staple');

    // Assert
    expect(isRight).toBe(true);
    expect(isWrong).toBe(false);
  });

  it('rejects any password when there is no account', async () => {
    // Act
    const isValid = await passwordHasher.verify(
      null,
      'dummy-password-for-timing',
    );

    // Assert
    expect(isValid).toBe(false);
  });
});
