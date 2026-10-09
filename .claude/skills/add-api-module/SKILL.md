---
name: add-api-module
description: Create a new NestJS domain module as a library in libs/api with tags, controller, service, database access and tests. Use when the API needs a new business area (for example orders or notes).
---

# Add an API module

Domain logic lives in libraries, not in `apps/api` (PRD section 7). One business area = one library.

## 1. Generate the library

Check the flags first with `npx nx g @nx/nest:lib --help`; defaults (Vitest, strict) come from `nx.json`.

```sh
npx nx g @nx/nest:lib libs/api/<area> --name=api-<area> --importPath=@starter/api/<area> --tags=scope:api,type:feature --no-interactive
```

Then align it with the existing libraries (`libs/api/users` is the reference):

- Rename the generated `api-<area>.module.ts` to `<area>.module.ts` and the class to `<Area>Module`.
- In `vitest.config.mts` replace the deprecated `nxViteTsPaths`/`nxCopyAssetsPlugin` plugins with `resolve: { tsconfigPaths: true }` and copy the `coverage` block with the 80% threshold from `libs/api/users/vitest.config.mts`.
- Add a short `README.md` and, if the module has rules that are not obvious, an `AGENTS.md` (then run `npm run ai:sync`).

## 2. Structure

```
libs/api/<area>/src/
  index.ts                     exports the module and services other modules may use
  lib/<area>.module.ts
  lib/<area>.controller.ts     thin: validation, current user, HTTP status
  lib/<area>.service.ts        business logic, maps rows to contract types
  lib/<area>.service.spec.ts
```

- Database access only through `PrismaService` from `@starter/api/database` (BE-10). Schema changes: use the `db-migration` skill.
- Shared infrastructure (`ApiException`, `SchemaValidationPipe`, `CurrentUser`, `Public`, `APP_CONFIG`) comes from `@starter/api/common`.
- A feature module may import other API feature modules (as `auth` imports `users`), never web code. Lint enforces this.
- NestJS uses constructor injection; `inject()` does not exist there.

## 3. Wire it into the app

Add the module to `imports` in `apps/api/src/app/app.module.ts`. For endpoints follow the `add-endpoint` skill.

## 4. Verify

```sh
npx nx run-many -t lint test -p api-<area>
npx nx affected -t lint test build
npm run test:integration
```
