import type { AppLifecycleEvent } from './app-lifecycle';
import { NativeAppLifecycle } from './native-app-lifecycle';

const app = vi.hoisted(() => ({
  platform: 'android',
  listeners: new Map<string, (event: unknown) => void>(),
  minimizeCount: 0,
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => app.platform },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: async (event: string, listener: (event: unknown) => void) => {
      app.listeners.set(event, listener);
      return {
        remove: async () => {
          app.listeners.delete(event);
        },
      };
    },
    minimizeApp: async () => {
      app.minimizeCount += 1;
    },
  },
}));

describe('NativeAppLifecycle', () => {
  beforeEach(() => {
    app.platform = 'android';
    app.listeners.clear();
    app.minimizeCount = 0;
  });

  it('maps @capacitor/app events to lifecycle events', async () => {
    // Arrange
    const lifecycle = new NativeAppLifecycle();
    const events: AppLifecycleEvent[] = [];
    const subscription = lifecycle.events.subscribe((event) =>
      events.push(event),
    );
    await Promise.resolve();

    // Act
    app.listeners.get('pause')?.(undefined);
    app.listeners.get('resume')?.(undefined);
    app.listeners.get('backButton')?.({ canGoBack: true });
    app.listeners.get('appUrlOpen')?.({
      url: 'https://app.example.com/account?tab=1',
    });
    app.listeners.get('appUrlOpen')?.({ url: 'not a url' });
    subscription.unsubscribe();
    await Promise.resolve();

    // Assert
    expect(events).toEqual([
      { type: 'pause' },
      { type: 'resume' },
      { type: 'back-button', canGoBack: true },
      { type: 'url-open', path: '/account?tab=1' },
    ]);
    expect(app.listeners.size).toBe(0);
  });

  it('minimises only on Android', async () => {
    // Arrange
    const lifecycle = new NativeAppLifecycle();

    // Act
    await lifecycle.minimize();
    app.platform = 'ios';
    await lifecycle.minimize();

    // Assert
    expect(app.minimizeCount).toBe(1);
  });
});
