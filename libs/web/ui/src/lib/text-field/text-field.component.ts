import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  inject,
  input,
} from '@angular/core';

import type { Field } from '@angular/forms/signals';

let nextFieldId = 0;

/** Marks the control projected into app-text-field; it receives id and ARIA attributes. */
@Directive({
  selector:
    'input[appFieldControl], textarea[appFieldControl], select[appFieldControl]',
  host: {
    class: 'app-field-control',
    '[id]': 'textField.controlId',
    '[attr.aria-describedby]': 'textField.describedBy()',
    '[attr.aria-invalid]': 'textField.showErrors() || null',
  },
})
export class FieldControlDirective {
  protected readonly textField = inject(TextFieldComponent);
}

/**
 * Label, control, hint and errors for one Signal Forms field (FE-24: every control has a label).
 * Errors appear after the field was touched, or after a submit attempt marked it touched.
 *
 * <app-text-field label="Email" [field]="loginForm.email">
 *   <input appFieldControl type="email" autocomplete="email" [formField]="loginForm.email" />
 * </app-text-field>
 */
@Component({
  selector: 'app-text-field',
  templateUrl: './text-field.component.html',
  styleUrl: './text-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextFieldComponent {
  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly field = input.required<Field<string>>();

  readonly controlId = `app-field-${nextFieldId++}`;
  protected readonly hintId = `${this.controlId}-hint`;
  protected readonly errorId = `${this.controlId}-error`;

  readonly showErrors = computed(() => {
    const state = this.field()();
    return state.touched() && state.invalid();
  });

  readonly errorMessages = computed(() =>
    this.showErrors()
      ? this.field()()
          .errors()
          .map((error) => error.message ?? error.kind)
      : [],
  );

  readonly describedBy = computed(
    () =>
      [
        this.hint() ? this.hintId : null,
        this.showErrors() ? this.errorId : null,
      ]
        .filter(Boolean)
        .join(' ') || null,
  );
}
