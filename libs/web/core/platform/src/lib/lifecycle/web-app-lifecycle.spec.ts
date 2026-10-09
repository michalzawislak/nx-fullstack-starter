import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import type { AppLifecycleEvent } from './app-lifecycle';
import { WebAppLifecycle } from './web-app-lifecycle';

describe('WebAppLifecycle', () => {
  const setVisibility = (state: DocumentVisibilityState): void => {
    Object.defineProperty(TestBed.inject(DOCUMENT), 'visibilityState', {
      configurable: true,
      get: () => state,
    });
  };

  it('maps page visibility to pause and resume', async () => {
    // Arrange
    TestBed.configureTestingModule({ providers: [WebAppLifecycle] });
    const lifecycle = TestBed.inject(WebAppLifecycle);
    const document = TestBed.inject(DOCUMENT);
    const events: AppLifecycleEvent[] = [];
    const subscription = lifecycle.events.subscribe((event) =>
      events.push(event),
    );

    // Act
    setVisibility('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    setVisibility('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    await lifecycle.minimize();
    subscription.unsubscribe();

    // Assert
    expect(events).toEqual([{ type: 'pause' }, { type: 'resume' }]);
  });
});
