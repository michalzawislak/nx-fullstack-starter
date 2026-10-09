import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { RouterLink, RouterLinkActive } from '@angular/router';

export interface ShellNavItem {
  readonly label: string;
  readonly path: string;
  /** Match the path exactly (use for the root route). */
  readonly exact?: boolean;
}

/**
 * Application frame with two navigation variants (FE-21): a bottom bar on narrow screens and
 * a side panel from the md breakpoint. Respects safe areas (FE-18).
 * Project page content as children and actions with the `shellActions` attribute.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  readonly appName = input.required<string>();
  readonly navItems = input.required<readonly ShellNavItem[]>();
}
