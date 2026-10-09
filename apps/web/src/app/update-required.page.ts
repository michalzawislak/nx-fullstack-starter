import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Shown when the API answers APP_VERSION_UNSUPPORTED (MOB-11). In the store apps, add a link to
 * the App Store or Google Play listing of the concrete app here.
 */
@Component({
  selector: 'app-update-required-page',
  template: `
    <section class="update" aria-labelledby="update-title">
      <h1 id="update-title">Update required</h1>
      <p>
        This version of the app is no longer supported. Install the latest
        version to continue.
      </p>
    </section>
  `,
  styles: `
    .update {
      max-width: 480px;
      margin: 0 auto;
      padding: calc(var(--space-7) + var(--safe-area-top)) var(--space-4);
      text-align: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateRequiredPage {}
