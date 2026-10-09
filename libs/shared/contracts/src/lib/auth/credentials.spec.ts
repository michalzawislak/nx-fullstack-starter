import {
  EMAIL_MAX_LENGTH,
  emailSchema,
  newPasswordSchema,
  PASSWORD_MAX_LENGTH,
} from './credentials';

describe('emailSchema', () => {
  it('trims and lower-cases the email', () => {
    // Act
    const email = emailSchema.parse('  Jane.Doe@Example.COM ');

    // Assert
    expect(email).toBe('jane.doe@example.com');
  });

  it.each(['', 'plain', 'jane@', '@example.com', 'jane doe@example.com'])(
    'rejects "%s"',
    (input) => {
      // Act
      const result = emailSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    },
  );

  it('rejects an email longer than the maximum length', () => {
    // Arrange
    const domain = '@example.com';
    const tooLongEmail = `${'a'.repeat(EMAIL_MAX_LENGTH - domain.length + 1)}${domain}`;

    // Act
    const result = emailSchema.safeParse(tooLongEmail);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('newPasswordSchema', () => {
  it.each([
    ['7 characters', 'a'.repeat(7), false],
    ['8 characters', 'a'.repeat(8), true],
    ['the maximum length', 'a'.repeat(PASSWORD_MAX_LENGTH), true],
    [
      'one character over the maximum',
      'a'.repeat(PASSWORD_MAX_LENGTH + 1),
      false,
    ],
  ] as const)('with %s gives %s', (_case, password, expected) => {
    // Act
    const result = newPasswordSchema.safeParse(password);

    // Assert
    expect(result.success).toBe(expected);
  });
});
