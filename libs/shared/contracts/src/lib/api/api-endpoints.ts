import { appConfigSchema } from '../app/app-config.contract';
import { loginRequestSchema } from '../auth/login.contract';
import {
  logoutRequestSchema,
  refreshRequestSchema,
} from '../auth/refresh.contract';
import { registerRequestSchema } from '../auth/register.contract';
import { tokenPairSchema } from '../auth/token-pair.contract';
import { healthStatusSchema } from '../health/health.contract';
import { userSchema } from '../users/user.contract';
import { API_PATHS } from './api-routes';
import { defineEndpoint } from './endpoint';

/** Every endpoint of the starter API with its request and response schema (PRD section 7.1, CON-1). */
export const API_ENDPOINTS = {
  auth: {
    register: defineEndpoint({
      method: 'POST',
      path: API_PATHS.auth.register,
      access: 'public',
      request: registerRequestSchema,
      response: tokenPairSchema,
    }),
    login: defineEndpoint({
      method: 'POST',
      path: API_PATHS.auth.login,
      access: 'public',
      request: loginRequestSchema,
      response: tokenPairSchema,
    }),
    refresh: defineEndpoint({
      method: 'POST',
      path: API_PATHS.auth.refresh,
      access: 'refresh-token',
      request: refreshRequestSchema,
      response: tokenPairSchema,
    }),
    logout: defineEndpoint({
      method: 'POST',
      path: API_PATHS.auth.logout,
      access: 'user',
      request: logoutRequestSchema,
      response: null,
    }),
  },
  users: {
    me: defineEndpoint({
      method: 'GET',
      path: API_PATHS.users.me,
      access: 'user',
      request: null,
      response: userSchema,
    }),
  },
  app: {
    config: defineEndpoint({
      method: 'GET',
      path: API_PATHS.app.config,
      access: 'public',
      request: null,
      response: appConfigSchema,
    }),
  },
  health: defineEndpoint({
    method: 'GET',
    path: API_PATHS.health,
    access: 'public',
    request: null,
    response: healthStatusSchema,
  }),
} as const;
