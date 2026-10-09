import { DOCUMENT, inject, Injectable } from '@angular/core';

import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

import { fromPluginEvent } from '../runtime/plugin-events';
import type { SystemUi } from './system-ui';

@Injectable()
export class NativeSystemUi implements SystemUi {
  private readonly document = inject(DOCUMENT);

  async hideSplashScreen(): Promise<void> {
    await SplashScreen.hide();
  }

  async applyStatusBarStyle(): Promise<void> {
    // Style.Default follows the system appearance, as do the tokens in libs/web/ui.
    await StatusBar.setStyle({ style: Style.Default });
  }

  keepFocusedFieldVisible(): () => void {
    const subscription = fromPluginEvent<unknown>((listener) =>
      Keyboard.addListener('keyboardDidShow', listener),
    ).subscribe(() => {
      const focusedElement = this.document.activeElement;

      if (focusedElement instanceof HTMLElement) {
        focusedElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });

    return () => subscription.unsubscribe();
  }
}
