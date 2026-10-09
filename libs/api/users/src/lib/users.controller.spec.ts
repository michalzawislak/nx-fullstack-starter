import { UsersController } from './users.controller';
import type { UsersService } from './users.service';

describe('UsersController', () => {
  it('returns the public profile of the current user', async () => {
    // Arrange
    const usersService = {
      getById: vi.fn(async () => ({
        id: 'user-1',
        email: 'jane@example.com',
        passwordHash: 'hash',
        createdAt: new Date('2026-10-09T08:00:00.000Z'),
        updatedAt: new Date('2026-10-09T08:00:00.000Z'),
      })),
    } as unknown as UsersService;

    // Act
    const user = await new UsersController(usersService).getMe({
      userId: 'user-1',
    });

    // Assert
    expect(usersService.getById).toHaveBeenCalledWith('user-1');
    expect(user).toEqual({
      id: 'user-1',
      email: 'jane@example.com',
      createdAt: '2026-10-09T08:00:00.000Z',
    });
  });
});
