---
name: add-platform-capability
description: Add a native capability (camera, push, geolocation, haptics, share, …) through a Capacitor plugin behind an interface and InjectionToken in libs/web/core/platform, with web, native and fake implementations and tests. Use whenever app code needs a device or browser API.
---

# Add a platform capability

App code never imports `@capacitor/*` or touches `window`, `document`, `navigator` or `localStorage`; ESLint blocks it everywhere except `libs/web/core/platform` (FE-9, FE-26). `NETWORK_STATUS` (signal), `APP_LIFECYCLE` (event stream) and `SECURE_STORAGE` (async methods) are the references.

## 1. Install the plugin

```sh
npm view @capacitor/<plugin> versions --json   # pick the newest with the same major as @capacitor/core
npm install @capacitor/<plugin>@^<major>
npm audit --omit=dev --audit-level=high        # must stay clean (ADR-0011)
```

A community plugin needs a short ADR: licence, maintenance, Capacitor major, what it stores and where.

## 2. Interface and token

`libs/web/core/platform/src/lib/<capability>/<capability>.ts`:

```ts
import { InjectionToken, type Signal } from '@angular/core';

/** What the app needs, not what the plugin offers. */
export interface Haptics {
  impact(style: 'light' | 'medium' | 'heavy'): Promise<void>;
}

export const HAPTICS = new InjectionToken<Haptics>('HAPTICS');
```

- Methods are asynchronous (`Promise`) or exposed as a `Signal` / `Observable`, even when the web version is synchronous (FE-10).
- Design for the narrowest need; never re-export plugin types.

## 3. Three implementations

- `web-<capability>.ts`: browser API through `inject(DOCUMENT).defaultView`, or a graceful no-op. Touch globals inside methods or the constructor, never at module load (SSR-safe).
- `native-<capability>.ts`: the plugin. Wrap listeners with `fromPluginEvent()` (from `../runtime/plugin-events`) so unsubscribing removes the native listener; end subscriptions with `takeUntilDestroyed(inject(DestroyRef))`.
- A fake in `src/lib/testing/platform-testing.ts`: add a class, a field in `PlatformTestingHandles`, `createPlatformTestingHandles()` and `providePlatformTesting()`.

## 4. Register

Add the token to both `webProviders` and `nativeProviders` in `src/lib/provide-platform.ts`, export the token file from `src/index.ts` (implementations stay private).

## 5. Native project setup

- Permissions: iOS usage strings in `ios/App/App/Info.plist` (`NS…UsageDescription`), Android permissions in `android/app/src/main/AndroidManifest.xml` if the plugin docs require them.
- `npm run cap:sync`, then build once in Xcode and Android Studio.

## 6. Tests (Arrange-Act-Assert)

- Web implementation with jsdom.
- Native implementation with `vi.mock('@capacitor/<plugin>', …)` and shared state from `vi.hoisted(...)`; see `storage/native-secure-storage.spec.ts`.
- Add the native class to the native case in `provide-platform.spec.ts`.
- Consumers test against the fake from `providePlatformTesting(handles)`, never against the plugin.

```sh
npx nx test web-core-platform
npx nx affected -t lint test build
```

## 7. Document

- One line in `libs/web/core/platform/AGENTS.md` (token list).
- Manual check on a simulator and an emulator; add the scenario to the device checklist in README if it is user-visible.
