# nx-fullstack-starter

Szablon monorepo: jedna baza kodu dla aplikacji web, aplikacji iOS i Android (Capacitor) oraz API w NestJS z PostgreSQL. Wymagania, decyzje i plan budowy są w [`docs/prd/starter.md`](docs/prd/starter.md), a uzasadnienia decyzji w [`docs/decisions/`](docs/decisions/README.md).

> Stan: krok 3 z 9 (workspace, kontekst AI, API z `/health`, PostgreSQL w Dockerze, szkielety bibliotek z granicami modułów). Kontrakt, auth, UI i Capacitor dochodzą w kolejnych krokach.

## Wymagania

- Node 24 (`nvm use` czyta `.nvmrc`), npm 11 lub nowszy. Starsze wersje są odrzucane przy `npm install` (`engine-strict`).
- Docker (Docker Desktop lub OrbStack) dla lokalnego PostgreSQL.
- Przed pierwszym uruchomieniem E2E: `npx playwright install`.

## Pierwsze uruchomienie

```sh
nvm use
npm install
cp .env.example .env
npm run dev     # PostgreSQL + web (http://localhost:4200) + API (http://localhost:3000/health)
```

## Komendy

| Zadanie                 | Komenda                                           |
| ----------------------- | ------------------------------------------------- |
| Instalacja              | `npm install`                                     |
| Baza, web i API         | `npm run dev`                                     |
| Aplikacja web           | `npx nx serve web` (http://localhost:4200)        |
| API                     | `npx nx serve api` (http://localhost:3000/health) |
| PostgreSQL start / stop | `npm run db:up` / `npm run db:down`               |
| Sprawdzenie zmiany      | `npx nx affected -t lint test build`              |
| Sprawdzenie wszystkiego | `npx nx run-many -t lint test build`              |
| E2E                     | `npx nx e2e web-e2e`                              |
| Graf projektów          | `npx nx graph`                                    |
| Pliki kontekstu AI      | `npm run ai:sync` / `npm run ai:check`            |

## Wersje (nx report, 9 października 2026)

| Pakiet     | Wersja            |
| ---------- | ----------------- |
| Node       | 24.21.0           |
| npm        | 11.21.0           |
| Nx         | 23.3.0            |
| Angular    | 22.2.2 (ADR-0009) |
| TypeScript | 6.0.3             |
| Vitest     | 4.1.x             |
| Playwright | 1.64.0            |
| NestJS     | 11.2.7 (ADR-0010) |
| PostgreSQL | 18 (Docker)       |

Aktualizacje wyłącznie przez `npx nx migrate latest`.

## Praca z narzędziami AI

Repozytorium jest przygotowane dla Claude Code, Cursora i GitHub Copilota (PRD, sekcja 10; ADR-0008).

- Instrukcje edytujesz tylko w plikach `AGENTS.md`, serwery MCP w `tools/ai/mcp-servers.json`, a skille w `.claude/skills/`. Po zmianie uruchom `npm run ai:sync`.
- `CLAUDE.md`, `.github/copilot-instructions.md`, `.github/instructions/*` i pliki `mcp.json` są generowane. CI sprawdza ich zgodność przez `npm run ai:check`.
- Konfiguracją Nx dla agentów (skille i blok w `AGENTS.md`) zarządza `npx nx configure-ai-agents`.
- Claude Code: przy pierwszym uruchomieniu zaakceptuj plugin Nx z `.claude/settings.json`; daje skille i serwer MCP Nx.
- Cursor i VS Code: serwery MCP (Nx, Angular CLI) włączają się z `.cursor/mcp.json` i `.vscode/mcp.json`.
