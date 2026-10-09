import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

/**
 * Native button or link with the starter styles. Keeps native semantics, keyboard support and
 * a 44 x 44 px touch target (FE-19, FE-24).
 *
 * <button appButton type="submit" [busy]="isSaving()">Save</button>
 */
@Component({
  // An attribute selector keeps native <button> and <a> semantics (keyboard, forms, links).
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[appButton], a[appButton]',
  template: `<ng-content />`,
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-button',
    '[class.app-button--secondary]': "variant() === 'secondary'",
    '[class.app-button--danger]': "variant() === 'danger'",
    '[class.app-button--block]': 'block()',
    '[attr.aria-busy]': 'busy() || null',
    '[attr.aria-disabled]': 'busy() || null',
  },
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly busy = input(false);
  readonly block = input(false);
}
