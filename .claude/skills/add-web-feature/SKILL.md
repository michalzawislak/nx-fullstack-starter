---
name: add-web-feature
description: Add a new screen or feature area to the Angular app as a lazy-loaded feature library with routes, Signal Forms validated by the shared Zod contract, API calls through ApiClient, tests and E2E. Use for any new page or flow in apps/web.
---

# Add a web feature

Every feature is its own library `libs/web/feature-<name>`, loaded lazily (FE-5). `libs/web/feature-auth` and `libs/web/feature-home` are the references.

## 1. Generate and normalise the library

Check the flags with `npx nx g @nx/angular:lib --help`; defaults (vitest-analog, standalone, OnPush, SCSS, prefix `app`) come from `nx.json`.

```sh
npx nx g @nx/angular:lib libs/web/feature-<name> --name=web-feature-<name> --importPath=@starter/web/feature-<name> --tags=scope:web,type:feature --no-interactive
```

Then:

- Delete the generated sample component in `src/lib/web-feature-<name>/`.
- Remove the `targets.lint` block with the deprecated `@nx/eslint:lint` executor from `project.json` (lint is inferred).
- Replace `vite.config.mts` with a copy of `libs/web/feature-home/vite.config.mts` and change the names and paths (no `nxViteTsPaths`/`nxCopyAssetsPlugin`; `resolve.tsconfigPaths: true`; coverage threshold 80%).
- If the feature uses `@defer (on viewport)`, copy the `IntersectionObserver` stub from `libs/web/feature-home/src/test-setup.ts`.

## 2. Build the screens

- Export a `Routes` array (`<name>.routes.ts`) or page components from `src/index.ts`, and register them in `apps/web/src/app/app.routes.ts` with `loadChildren`/`loadComponent` and `canMatch: [authGuard]` (or `guestGuard` for signed-out pages). Never import a feature library statically.
- Pages: standalone, `ChangeDetectionStrategy.OnPush`, `inject()`, signals, `@if`/`@for`/`@defer`. File names `<name>.page.ts`, `<name>.component.ts`.
- Data: `rxResource({ stream: () => inject(ApiClient).request(API_ENDPOINTS.x.y) })` or `ApiClient` in a service. Read `resource.value()` only after `resource.hasValue()`; in the error state `value()` throws.
- Forms: Signal Forms with the contract schema:

  ```ts
  protected readonly noteForm = form(signal<CreateNoteRequest>({ title: '' }), (path) =>
    validateStandardSchema(path, createNoteRequestSchema), { submission: { action: async (field) => { /* call the API */ return undefined; } } });
  ```

  ```html
  <form [formRoot]="noteForm">
    <app-text-field label="Title" [field]="noteForm.title">
      <input appFieldControl [formField]="noteForm.title" />
    </app-text-field>
    <button appButton type="submit" [busy]="noteForm().submitting()">Save</button>
  </form>
  ```

- Errors: branch on `ApiRequestError.errorCode` and `NetworkError` (see `libs/web/feature-auth/src/lib/shared/auth-error-message.ts`), never on the server message.
- UI: components from `@starter/web/ui`; spacing, colours and sizes only through the CSS variables from `libs/web/ui/src/styles/_tokens.scss`; mobile first; touch targets at least 44 px; every control labelled.
- No `window`, `document`, `localStorage` or `@capacitor/*` here; use the tokens from `@starter/web/core/platform`.

## 3. Test

- Unit tests next to the pages (`*.spec.ts`, Arrange-Act-Assert): render with `TestBed`, replace `SessionService`/`ApiClient` with simple fakes, drive forms through DOM events and `form.dispatchEvent(new Event('submit'))`.
- E2E in `apps/web-e2e/src/<name>.spec.ts` with role and label locators; both projects (`mobile`, `desktop`) run every test. Create fresh data per test (`uniqueEmail()` in `support/auth.ts`).

## 4. Verify

```sh
npx nx affected -t lint test build
npx nx e2e web-e2e        # needs npm run db:up
```

Check the build output: the new feature must appear as a lazy chunk, not grow the initial bundle.
