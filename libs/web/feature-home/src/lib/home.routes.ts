import type { Routes } from '@angular/router';

import { AccountPage } from './account/account.page';
import { HomePage } from './home/home.page';

/** Lazy-loaded by apps/web behind authGuard (FE-5). */
export const homeRoutes: Routes = [
  { path: '', component: HomePage, title: 'Home' },
  { path: 'account', component: AccountPage, title: 'Account' },
];
