# ADR-0008: Kontekst dla narzędzi AI z jednego źródła

- Status: przyjęta
- Data: 2026-10-09

## Kontekst

Starter będzie używany z Claude Code, Cursorem i GitHub Copilotem. Każde narzędzie czyta inne pliki (PRD, sekcja 10.1), a Nx 23.3 sam generuje część konfiguracji (`nx configure-ai-agents`).

## Decyzja

- Ręcznie edytowane są tylko pliki `AGENTS.md`, `tools/ai/mcp-servers.json` i skille w `.claude/skills/`.
- `npm run ai:sync` (`tools/ai/sync.mts`) generuje `CLAUDE.md`, `.github/copilot-instructions.md`, `.github/instructions/*` i konfiguracje MCP. `npm run ai:check` sprawdza ich zgodność i stan konfiguracji Nx.
- Konfiguracją Nx (blok w `AGENTS.md`, `.claude/settings.json`, skille Nx w `.agents/skills/` i `.github/skills/`, agenci i prompty) zarządza Nx; nie edytujemy jej ręcznie.

## Odrzucone opcje

- **Własny katalog `ai/`** – żadne narzędzie go nie znajdzie.
- **Konfiguracja pod jedno narzędzie** – zespół używa różnych.
- **Ręczne kopie instrukcji** – rozjeżdżają się.
- **`CLAUDE.md` z samym `@AGENTS.md`** – `nx configure-ai-agents --check` zgłasza wtedy nieaktualną konfigurację i przy aktualizacji dopisuje swój blok. Główny `CLAUDE.md` to więc `@AGENTS.md` plus blok Nx; Claude Code widzi ten blok dwa razy (ok. 25 linii) w zamian za automatyczne aktualizacje od Nx.

## Konsekwencje

- Nx przy tworzeniu workspace wykrywa agenta AI po zmiennych środowiskowych (`CLAUDECODE` i podobnych) i podmienia preset `angular-monorepo` na szablon demonstracyjny. Agent tworzący workspace musi uruchomić `create-nx-workspace` bez tych zmiennych.
- Nx dodaje skille związane z Nx Cloud (`monitor-ci`, `nx-cloud-*`), z którego starter nie korzysta. Zostają, bo usunięte wrócą przy aktualizacji.
- Serwer MCP Nx dla Claude Code pochodzi z pluginu Nx, dla Cursora i VS Code z `.cursor/mcp.json` i `.vscode/mcp.json`.

## Kiedy wrócić do decyzji

Gdy któreś narzędzie zmieni pliki, które czyta (ryzyko R8), albo Nx zacznie generować całą potrzebną konfigurację sam.
