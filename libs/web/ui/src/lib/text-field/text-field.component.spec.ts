import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { form, FormField, required } from '@angular/forms/signals';

import {
  FieldControlDirective,
  TextFieldComponent,
} from './text-field.component';

@Component({
  imports: [TextFieldComponent, FieldControlDirective, FormField],
  template: `
    <app-text-field
      label="Email"
      hint="Work address"
      [field]="profileForm.email"
    >
      <input appFieldControl type="email" [formField]="profileForm.email" />
    </app-text-field>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostComponent {
  readonly profileForm = form(signal({ email: '' }), (path) =>
    required(path.email, { message: 'Email is required' }),
  );
}

describe('TextFieldComponent', () => {
  async function render() {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      element,
      input: element.querySelector('input') as HTMLInputElement,
    };
  }

  it('links the label and the hint to the control (FE-24)', async () => {
    // Act
    const { element, input } = await render();

    // Assert
    const label = element.querySelector('label') as HTMLLabelElement;
    expect(label.htmlFor).toBe(input.id);
    expect(input.getAttribute('aria-describedby')).toContain(
      `${input.id}-hint`,
    );
  });

  it('shows errors only after the field was touched', async () => {
    // Arrange
    const { fixture, element, input } = await render();
    const errorsBeforeTouch = element.querySelector('[role="alert"]');

    // Act
    fixture.componentInstance.profileForm.email().markAsTouched();
    await fixture.whenStable();

    // Assert
    expect(errorsBeforeTouch).toBeNull();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Email is required',
    );
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain(
      `${input.id}-error`,
    );
  });
});
