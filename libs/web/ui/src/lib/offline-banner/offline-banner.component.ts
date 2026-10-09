import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Visible offline state instead of silent failures (FE-16, MOB-10). Announced to screen readers. */
@Component({
  selector: 'app-offline-banner',
  template: `
    <div class="banner" role="status" aria-live="polite">
      @if (isOffline()) {
        <span>{{ message() }}</span>
      }
    </div>
  `,
  styleUrl: './offline-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.offline]': 'isOffline()' },
})
export class OfflineBannerComponent {
  readonly isOffline = input.required<boolean>();
  readonly message = input(
    'You are offline. Changes will not be saved until the connection is back.',
  );
}
