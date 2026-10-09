import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

/**
 * Capacitor for iOS and Android (PRD section 6, ADR-0016).
 *
 * `CAPACITOR_DEV=1` is set only by the `*:dev` scripts (simulators, emulators, live reload).
 * It allows plain HTTP to the local API; release syncs (`npm run cap:sync`) never set it (MOB-13).
 * Always run a release sync before an App Store or Play Store build: a dev sync leaves the
 * cleartext permission in the Android project until the next release sync.
 */
const isDevBuild = process.env['CAPACITOR_DEV'] === '1';

const config: CapacitorConfig = {
  // Change both before the first store upload; the app ID cannot change after that.
  appId: 'com.example.starter',
  appName: 'Starter',
  // Output of `nx build web --configuration=mobile` (MOB-1, MOB-2).
  webDir: 'dist/apps/web-mobile/browser',
  // Navigation stays inside the app; links to other origins open in the system browser (MOB-14).
  // Do not add server.allowNavigation without an ADR.
  server: {
    androidScheme: 'https',
    cleartext: isDevBuild,
  },
  android: {
    // The https://localhost page of a dev build calls the API over http://10.0.2.2:3000.
    allowMixedContent: isDevBuild,
    webContentsDebuggingEnabled: isDevBuild,
  },
  ios: {
    webContentsDebuggingEnabled: isDevBuild,
  },
  plugins: {
    SplashScreen: {
      // Hidden by provideNativeShell() after the first render, not after a fixed time (MOB-9).
      launchAutoHide: false,
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      // The WebView shrinks above the keyboard; the focused field is scrolled into view (MOB-8).
      resize: KeyboardResize.Native,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
