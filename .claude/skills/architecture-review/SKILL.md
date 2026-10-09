---
name: architecture-review
description: Review a change (diff, branch or pull request) against the starter's architecture - module boundaries, shared contract, platform isolation, API versioning, error codes, auth, security and tests - and report findings with file references. Use before merging, or when asked to check whether code follows the architecture.
---

# Architecture review

The rules live in `docs/architecture.md`, the root `AGENTS.md` and the `AGENTS.md` of each area. Lint already enforces part of them; this review covers what lint cannot see. Report findings, do not rewrite the change unless asked.

## 1. Collect the change

```sh
git diff --stat main...HEAD
git diff main...HEAD
npx nx show projects --affected
```

Read the `AGENTS.md` of every touched area before judging it.

## 2. Run the automatic checks first

```sh
npx nx affected -t lint typecheck test build
npm run format:check
npm run ai:check
```

A failing check is the first finding. Never suggest loosening a lint rule or a tag to make it pass.

## 3. Checklist

**Boundaries and placement**

- [ ] Logic is in `libs/*`; `apps/*` only wire routes, providers and modules.
- [ ] New libraries have both tags (`scope:*`, `type:*`), an alias in `tsconfig.base.json` and an `AGENTS.md`.
- [ ] Web features do not import other features; shared code moved to `core` or `ui`.
- [ ] `libs/web/ui` stays presentational: no `ApiClient`, `SessionService` or routing logic.

**Contract**

- [ ] Every request and response shape is a Zod schema in `libs/shared/contracts`, with an `API_ENDPOINTS` entry; no duplicated DTO interfaces on either side.
- [ ] Changes inside `/v1` are additive (new endpoint, optional request field, new response field). Removing or renaming a field, changing a type or adding a required request field needs `/v2`.
- [ ] New failure cases have an `errorCode` in `error-code.ts`; the API throws `ApiException`; the UI branches on `errorCode`, never on `message`.
- [ ] `zod/mini` only.

**API**

- [ ] Body validated with `SchemaValidationPipe` and the contract schema.
- [ ] Public endpoints are marked `@Public()` on purpose; everything else needs the access token.
- [ ] The current user comes from `@CurrentUser()`, and queries are scoped to that user (no reading another user's rows by ID).
- [ ] Configuration is read through `APP_CONFIG`; new variables are in the schema in `app-config.ts` and in `.env.example`, and do not collide with variables that tools read (`PORT`, `NODE_OPTIONS`, …).
- [ ] Database access goes through `PrismaService` in a service, not in controllers. Schema changes have a migration (`npm run db:check` passes).
- [ ] Responses never contain password hashes or token hashes (`toPublicUser` pattern).

**Frontend**

- [ ] Standalone components, `OnPush`, signals, `inject()`, `@if`/`@for`/`@defer`; feature routes lazy-loaded.
- [ ] HTTP only through `ApiClient.request(API_ENDPOINTS…)`.
- [ ] No `@capacitor/*` or browser globals outside `libs/web/core/platform`; new device features follow `add-platform-capability`.
- [ ] Tokens and secrets only in `SECURE_STORAGE`; nothing sensitive in `KEY_VALUE_STORAGE` or logs.
- [ ] Mobile-first: touch targets ≥ 44 px, safe areas, design tokens from `_tokens.scss` instead of literal colours and sizes; accessible labels and focus states.

**Security**

- [ ] No `innerHTML`, `bypassSecurityTrust*`, `eval` or string-built URLs from user input.
- [ ] Redirects use `safeReturnUrl`-style checks; deep links go through the router and its guards.
- [ ] No secrets or real credentials in code, fixtures or `.env.example`.
- [ ] New production dependencies pass `npm audit --omit=dev --audit-level=high`; new Capacitor plugins share the major version of `@capacitor/core`.

**Tests and docs**

- [ ] Every new piece of code has tests in Arrange-Act-Assert; coverage of libraries stays ≥ 80%.
- [ ] New endpoints have an integration test; user-facing flows have an E2E case when they change navigation or auth.
- [ ] A decision that changes a rule has a new ADR in `docs/decisions/`; affected `AGENTS.md` files and skills are updated, then `npm run ai:sync`.

## 4. Report

Group findings by severity, each with `path:line`, the rule it breaks (requirement ID or ADR when there is one) and a concrete fix:

1. **Blocking**: broken boundary, contract change that breaks `/v1`, security issue, missing migration, failing check.
2. **Should fix**: missing tests, missing `errorCode`, logic in an app, wrong storage for data.
3. **Suggestions**: naming, structure, docs.

End with a one-line verdict: ready to merge, or what must change first.
