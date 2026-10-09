import type { Route } from '@angular/router';

import { authGuard, guestGuard } from '@starter/web/core/auth';

/** Every feature is lazy-loaded (FE-5); path-based routing maps deep links to routes (MOB-3). */
export const appRoutes: Route[] = [
  {
    path: 'login',
    canMatch: [guestGuard],
    title: 'Sign in',
    loadComponent: () =>
      import('@starter/web/feature-auth').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canMatch: [guestGuard],
    title: 'Create an account',
    loadComponent: () =>
      import('@starter/web/feature-auth').then((m) => m.RegisterPage),
  },
  {
    path: 'update-required',
    title: 'Update required',
    loadComponent: () =>
      import('./update-required.page').then((m) => m.UpdateRequiredPage),
  },
  {
    path: '',
    canMatch: [authGuard],
    loadChildren: () =>
      import('@starter/web/feature-home').then((m) => m.homeRoutes),
  },
  { path: '**', redirectTo: '' },
];
