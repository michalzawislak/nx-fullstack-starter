import {
  type AuthenticatedRequest,
  getAuthenticatedUser,
} from './current-user.decorator';

describe('getAuthenticatedUser', () => {
  it('returns the user attached by the access-token guard', () => {
    // Arrange
    const request = { user: { userId: 'user-1' } } as AuthenticatedRequest;

    // Act
    const user = getAuthenticatedUser(request);

    // Assert
    expect(user).toEqual({ userId: 'user-1' });
  });

  it('fails loudly when used on a route without authentication', () => {
    // Act
    const read = () => getAuthenticatedUser({} as AuthenticatedRequest);

    // Assert
    expect(read).toThrow('CurrentUser used on a route without authentication');
  });
});
