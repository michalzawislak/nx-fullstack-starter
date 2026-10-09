import { Injectable } from '@angular/core';

import type { SystemUi } from './system-ui';

/** Browsers handle the keyboard and have no splash screen or status bar to control. */
@Injectable()
export class WebSystemUi implements SystemUi {
  async hideSplashScreen(): Promise<void> {
    // Nothing to hide on the web.
  }

  async applyStatusBarStyle(): Promise<void> {
    // The browser owns its chrome.
  }

  keepFocusedFieldVisible(): () => void {
    return () => undefined;
  }
}
