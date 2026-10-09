import { Injectable } from '@nestjs/common';

import { ApiException } from '@starter/api/common';
import {
  isUniqueConstraintError,
  PrismaService,
  type User as UserRecord,
} from '@starter/api/database';

import type { User } from '@starter/shared/contracts';

export interface NewUser {
  readonly email: string;
  readonly passwordHash: string;
}

/** Maps a database row to the public contract; the password hash never leaves this module. */
export function toPublicUser(user: UserRecord): User {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(newUser: NewUser): Promise<UserRecord> {
    try {
      return await this.prisma.user.create({ data: newUser });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ApiException(
          'EMAIL_TAKEN',
          'An account with this email already exists',
        );
      }

      throw error;
    }
  }

  findByEmail(email: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async getById(userId: string): Promise<UserRecord> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new ApiException('UNAUTHENTICATED', 'The account no longer exists');
    }

    return user;
  }
}
