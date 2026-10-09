import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ButtonComponent, type ButtonVariant } from './button.component';

@Component({
  imports: [ButtonComponent],
  template: `<button
    appButton
    type="button"
    [variant]="variant()"
    [busy]="busy()"
    [block]="true"
  >
    Save
  </button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostComponent {
  readonly variant = signal<ButtonVariant>('primary');
  readonly busy = signal(false);
}

describe('ButtonComponent', () => {
  it('keeps the native button and reflects variant and busy state', async () => {
    // Arrange
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button',
    ) as HTMLButtonElement;
    const initialBusy = button.getAttribute('aria-busy');

    // Act
    fixture.componentInstance.variant.set('danger');
    fixture.componentInstance.busy.set(true);
    await fixture.whenStable();

    // Assert
    expect(initialBusy).toBeNull();
    expect(button.textContent?.trim()).toBe('Save');
    expect(button.classList).toContain('app-button--danger');
    expect(button.classList).toContain('app-button--block');
    expect(button.getAttribute('aria-busy')).toBe('true');
  });
});
