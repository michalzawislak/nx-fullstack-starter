import { TestBed } from '@angular/core/testing';

import { OfflineBannerComponent } from './offline-banner.component';

describe('OfflineBannerComponent', () => {
  it('keeps an empty live region online and announces the offline state', async () => {
    // Arrange
    const fixture = TestBed.createComponent(OfflineBannerComponent);
    fixture.componentRef.setInput('isOffline', false);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const onlineText = element.textContent?.trim();

    // Act
    fixture.componentRef.setInput('isOffline', true);
    await fixture.whenStable();

    // Assert
    expect(onlineText).toBe('');
    expect(
      element.querySelector('[role="status"]')?.getAttribute('aria-live'),
    ).toBe('polite');
    expect(element.textContent).toContain('You are offline');
  });
});
