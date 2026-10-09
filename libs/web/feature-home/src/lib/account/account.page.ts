import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';

import { Router } from '@angular/router';

import { SessionService } from '@starter/web/core/auth';
import { ButtonComponent } from '@starter/web/ui';

import { currentUserResource } from '../current-user';

@Component({
  selector: 'app-account-page',
  imports: [ButtonComponent],
  templateUrl: './account.page.html',
  styleUrl: '../home/home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountPage {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly user = currentUserResource();
  protected readonly isSigningOut = signal(false);

  protected async signOut(): Promise<void> {
    this.isSigningOut.set(true);
    await this.session.logout();
    await this.router.navigateByUrl('/login');
  }
}
