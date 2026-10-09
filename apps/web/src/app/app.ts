import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { RouterOutlet } from '@angular/router';

import { SessionService } from '@starter/web/core/auth';
import { NETWORK_STATUS } from '@starter/web/core/platform';
import {
  AppShellComponent,
  OfflineBannerComponent,
  type ShellNavItem,
} from '@starter/web/ui';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppShellComponent, OfflineBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly session = inject(SessionService);
  protected readonly network = inject(NETWORK_STATUS);
  protected readonly appName = 'Starter';
  protected readonly navItems: readonly ShellNavItem[] = [
    { label: 'Home', path: '/', exact: true },
    { label: 'Account', path: '/account' },
  ];
}
