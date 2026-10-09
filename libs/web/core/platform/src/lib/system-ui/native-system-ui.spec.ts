import { TestBed } from '@angular/core/testing';

import { NativeSystemUi } from './native-system-ui';
import { WebSystemUi } from './web-system-ui';

const plugins = vi.hoisted(() => ({
  calls: [] as string[],
  keyboardListener: null as (() => void) | null,
}));

vi.mock('@capacitor/splash-screen', () => ({
  SplashScreen: {
    hide: async () => {
      plugins.calls.push('splash:hide');
    },
  },
}));

vi.mock('@capacitor/status-bar', () => ({
  Style: { Default: 'DEFAULT' },
  StatusBar: {
    setStyle: async ({ style }: { style: string }) => {
      plugins.calls.push(`statusBar:${style}`);
    },
  },
}));

vi.mock('@capacitor/keyboard', () => ({
  Keyboard: {
    addListener: async (_event: string, listener: () => void) => {
      plugins.keyboardListener = listener;
      return {
        remove: async () => {
          plugins.keyboardListener = null;
        },
      };
    },
  },
}));

describe('NativeSystemUi', () => {
  beforeEach(() => {
    plugins.calls.length = 0;
    plugins.keyboardListener = null;
    TestBed.configureTestingModule({ providers: [NativeSystemUi] });
  });

  it('hides the splash screen and follows the system status bar style', async () => {
    // Arrange
    const systemUi = TestBed.inject(NativeSystemUi);

    // Act
    await systemUi.applyStatusBarStyle();
    await systemUi.hideSplashScreen();

    // Assert
    expect(plugins.calls).toEqual(['statusBar:DEFAULT', 'splash:hide']);
  });

  it('scrolls the focused field into view when the keyboard opens', async () => {
    // Arrange
    const systemUi = TestBed.inject(NativeSystemUi);
    const input = document.createElement('input');
    document.body.append(input);
    input.focus();
    const scrollSpy = vi.fn();
    input.scrollIntoView = scrollSpy;

    // Act
    const stop = systemUi.keepFocusedFieldVisible();
    await Promise.resolve();
    plugins.keyboardListener?.();
    stop();
    await Promise.resolve();

    // Assert
    expect(scrollSpy).toHaveBeenCalledWith({
      block: 'center',
      behavior: 'smooth',
    });
    expect(plugins.keyboardListener).toBeNull();
    input.remove();
  });
});

describe('WebSystemUi', () => {
  it('does nothing', async () => {
    // Arrange
    const systemUi = new WebSystemUi();

    // Act
    const stop = systemUi.keepFocusedFieldVisible();

    // Assert
    await expect(systemUi.hideSplashScreen()).resolves.toBeUndefined();
    await expect(systemUi.applyStatusBarStyle()).resolves.toBeUndefined();
    expect(stop()).toBeUndefined();
  });
});
