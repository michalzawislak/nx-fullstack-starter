# AGENTS.md

Monorepo starter: one codebase for a web app, iOS and Android apps (Capacitor) and a NestJS API with PostgreSQL. It is a template for future apps, so it carries no business logic.

- Requirements and plan: `docs/prd/starter.md` (requirement IDs such as FE-3, BE-4, AI-2 come from there).
- Decisions and the reasons behind them: `docs/decisions/`. Do not reverse a decision without writing a new ADR.
- Product context of an app built on this starter: `docs/product/` (empty in the starter).

## Repository map

```
apps/web          Angular app (web + source for Capacitor)
apps/web-e2e      Playwright tests for apps/web
apps/api          NestJS 11 API: app module, HTTP setup, health, integration tests
docker-compose.yml  PostgreSQL 18 for local development
libs/shared/contracts   Zod contract shared by web and API
libs/web/core/platform  platform abstractions (only place for Capacitor and browser globals)
libs/web/core/http      HTTP client and interceptors
libs/web/core/auth      session state and guards
libs/web/ui             presentational components and styles
libs/api/database       database access
libs/api/common         shared API infrastructure
libs/api/auth           auth module
libs/api/users          users module
tools/ai          AI context generator (sync.mts) and MCP server list
docs/             PRD, ADRs, product context
```

Libraries are empty shells until steps 4 to 8 fill them. Planned and not created yet: `libs/web/feature-auth`, `libs/web/feature-home`, `capacitor.config.ts`, `ios/`, `android/`. Import libraries through their aliases (`@starter/shared/contracts`, `@starter/web/core/platform`, `@starter/api/database`, …), never through relative paths across projects. Each new area gets its own `AGENTS.md`.

## Commands

Node 24 (`.nvmrc`) and npm 11 or newer are required.

| Task                        | Command                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| Install                     | `npm install`                                                      |
| Run database, web and API   | `npm run dev` (needs Docker; copy `.env.example` to `.env`)        |
| Run the web app             | `npx nx serve web`                                                 |
| Run the API                 | `npx nx serve api` (http://localhost:3000/health)                  |
| Start / stop PostgreSQL     | `npm run db:up` / `npm run db:down`                                |
| Verify a change             | `npx nx affected -t lint test build`                               |
| Verify everything           | `npx nx run-many -t lint test build`                               |
| E2E                         | `npx nx e2e web-e2e` (first run: `npx playwright install`)         |
| API integration tests       | `npm run test:integration` (PostgreSQL, applies migrations first)  |
| Database migration          | `npm run db:migrate -- --name <change>` then `npm run db:generate` |
| Seed the test account       | `npm run db:seed` (demo@example.com / starter-password)            |
| Regenerate AI context files | `npm run ai:sync`                                                  |
| Check AI context files      | `npm run ai:check`                                                 |

Run the verify command before you consider a change done.

## Core rules

<!-- core-rules:start -->

- Frontend and backend never import each other; they meet only in `libs/shared`. Module boundaries are enforced by `@nx/enforce-module-boundaries` through `scope:*` and `type:*` tags (PRD section 4). Fix a boundary error by moving code, never by loosening tags.
- API contracts live in `libs/shared/contracts` as Zod schemas: one schema gives the type, the API validation and the form validation. Do not duplicate DTO types.
- Angular: standalone components only, signals for state, `ChangeDetectionStrategy.OnPush`, zoneless, `inject()` instead of constructor injection, `@if`/`@for`/`@defer` templates, lazy-loaded `feature-*` libraries.
- Platform access (`@capacitor/*`, `window`, `document`, `localStorage`, `navigator`) only inside `libs/web/core/platform`, behind an interface and an `InjectionToken`.
- API routes are versioned (`/v1`). Within a version only additive changes. Errors use the `ApiError` shape with an `errorCode`; clients react to `errorCode`, never to the message.
- TypeScript `strict`, no `any`. File names in kebab-case with Angular suffixes (`*.component.ts`, `*.service.ts`, `*.spec.ts`).
- Imports are ordered and grouped by `simple-import-sort` (Angular core, RxJS, other Angular, NestJS, packages, `@starter/*/core`, `@starter/shared`, environments, relative); `npx nx lint <project> --fix` sorts them.
- Tests follow Arrange-Act-Assert. Every piece of starter code has a test.
- Do not bump framework versions by hand; use `npx nx migrate latest`. Exceptions need an ADR.
- Never edit generated files (they start with "Generated by `npm run ai:sync`"); edit the source and run `npm run ai:sync`.
<!-- core-rules:end -->

## Skills

Recipes for recurring tasks live in `.claude/skills/` (read by Claude Code, Cursor and Copilot): `add-endpoint`, `add-api-module`, `db-migration`. Use them instead of improvising; update a skill when the pattern it describes changes.

## AI context in this repository

- Instructions: `AGENTS.md` files (this one and one per area). They are the only hand-edited instruction files.
- Skills: `.claude/skills/<name>/SKILL.md`, the one location read by Claude Code, Cursor and Copilot. Keep skills tool-neutral: only `name` and `description` in the frontmatter, plain `npx nx …` and `npm run …` commands.
- Generated from the sources by `npm run ai:sync`: `CLAUDE.md` files, `.github/copilot-instructions.md`, `.github/instructions/*`, `.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`. MCP servers are listed in `tools/ai/mcp-servers.json`.
- Managed by Nx (`npx nx configure-ai-agents`): the block below, `.claude/settings.json`, `.agents/skills/`, `.github/skills/`, `.github/agents/`, `.github/prompts/`, `.cursor/agents/`. Update them with Nx, do not edit them by hand.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
