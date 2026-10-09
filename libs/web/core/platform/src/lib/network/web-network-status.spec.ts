import { TestBed } from '@angular/core/testing';

import { WebNetworkStatus } from './web-network-status';

describe('WebNetworkStatus', () => {
  const setNavigatorOnline = (isOnline: boolean): void => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => isOnline,
    });
  };

  afterEach(() => setNavigatorOnline(true));

  it('follows the offline and online events', () => {
    // Arrange
    setNavigatorOnline(true);
    TestBed.configureTestingModule({ providers: [WebNetworkStatus] });
    const networkStatus = TestBed.inject(WebNetworkStatus);
    const initial = networkStatus.isOnline();

    // Act
    setNavigatorOnline(false);
    window.dispatchEvent(new Event('offline'));
    const afterOffline = networkStatus.isOnline();
    setNavigatorOnline(true);
    window.dispatchEvent(new Event('online'));

    // Assert
    expect(initial).toBe(true);
    expect(afterOffline).toBe(false);
    expect(networkStatus.isOnline()).toBe(true);
  });

  it('stops listening when the injector is destroyed', () => {
    // Arrange
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    TestBed.configureTestingModule({ providers: [WebNetworkStatus] });
    TestBed.inject(WebNetworkStatus);

    // Act
    TestBed.resetTestingModule();

    // Assert
    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
