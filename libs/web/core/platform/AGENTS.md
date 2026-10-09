# libs/web/core/platform

The only place in the frontend that may touch Capacitor plugins and browser globals (`window`, `document`, `localStorage`, `sessionStorage`, `navigator`). ESLint blocks them everywhere else (FE-9, FE-26, QA-4); this library's `eslint.config.mjs` is the only opt-out.

For every platform capability (PRD section 5.2):

1. An interface and an `InjectionToken` (for example `KeyValueStorage` and `KEY_VALUE_STORAGE`). Methods are asynchronous (`Promise` or a signal) even when the web implementation is synchronous (FE-10).
2. A web implementation, a native implementation (Capacitor) and an in-memory test implementation (FE-11).
3. Registration in `providePlatform()`, which picks web or native once with `Capacitor.isNativePlatform()` (native implementations arrive in step 8; until then `providePlatform()` registers the web ones).

Tests use `providePlatformTesting(handles)` with `createPlatformTestingHandles()`: in-memory storage, `FakeNetworkStatus.setOnline()`, `FakeAppLifecycle.emit()` and `FakePlatformInfo.setPlatform()`.

Other rules:

- Consumers inject the token, never a concrete implementation class.
- Capacitor plugin versions share the major version of `@capacitor/core`.
- Tokens and refresh tokens go only to `SECURE_STORAGE` (Keychain or Keystore on native), never to `KEY_VALUE_STORAGE` (MOB-12).
- Read browser objects through `inject(DOCUMENT)` and `document.defaultView`, not through the globals, so tests can replace them.
- Code must stay safe to load on a server: touch globals inside methods or constructors, not at module load time.
