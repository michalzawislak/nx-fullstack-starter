import { InjectionToken } from '@angular/core';

/** Native chrome around the WebView: splash screen, status bar, keyboard (MOB-8, MOB-9). */
export interface SystemUi {
  /** Hides the launch splash screen; called once after the first render (MOB-9). */
  hideSplashScreen(): Promise<void>;
  /** Status bar text follows the system light or dark appearance, like the design tokens (MOB-9). */
  applyStatusBarStyle(): Promise<void>;
  /** Scrolls the focused form field into view when the keyboard opens (MOB-8). Returns a teardown. */
  keepFocusedFieldVisible(): () => void;
}

export const SYSTEM_UI = new InjectionToken<SystemUi>('SYSTEM_UI');
