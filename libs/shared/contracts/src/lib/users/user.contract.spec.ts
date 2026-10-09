import { userSchema } from './user.contract';

describe('userSchema', () => {
  const validUser = {
    id: '7b0c6f0e-3c1a-4a51-9a8e-2f0f2a7c9d11',
    email: 'jane@example.com',
    createdAt: '2026-10-09T08:00:00.000Z',
  };

  it('accepts a valid user and drops unknown fields', () => {
    // Act
    const user = userSchema.parse({ ...validUser, passwordHash: 'never-sent' });

    // Assert
    expect(user).toEqual(validUser);
  });

  it.each([
    ['a non-UUID id', { ...validUser, id: '42' }],
    ['a date without time', { ...validUser, createdAt: '2026-10-09' }],
    ['an invalid email', { ...validUser, email: 'jane' }],
  ])('rejects %s', (_case, body) => {
    // Act
    const result = userSchema.safeParse(body);

    // Assert
    expect(result.success).toBe(false);
  });
});
