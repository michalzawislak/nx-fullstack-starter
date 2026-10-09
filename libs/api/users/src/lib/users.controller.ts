import { Controller, Get } from '@nestjs/common';

import { type AuthenticatedUser, CurrentUser } from '@starter/api/common';

import { API_ROUTES, API_VERSION, type User } from '@starter/shared/contracts';

import { toPublicUser, UsersService } from './users.service';

@Controller({ path: API_ROUTES.users.controller, version: API_VERSION })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(API_ROUTES.users.me)
  async getMe(@CurrentUser() currentUser: AuthenticatedUser): Promise<User> {
    return toPublicUser(await this.usersService.getById(currentUser.userId));
  }
}
