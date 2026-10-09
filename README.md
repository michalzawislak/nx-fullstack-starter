# nx-fullstack-starter

Szablon monorepo: jedna baza kodu dla aplikacji web, aplikacji iOS i Android (Capacitor) oraz API w NestJS z PostgreSQL. Wymagania, decyzje i plan budowy są w [`docs/prd/starter.md`](docs/prd/starter.md), a uzasadnienia decyzji w [`docs/decisions/`](docs/decisions/README.md).

> Stan: krok 8 z 9 (workspace, kontekst AI, API z `/health`, PostgreSQL w Dockerze, szkielety bibliotek z granicami modułów, kontrakt API w Zod, API z bazą, auth i OpenAPI, warstwa platformy, HTTP i sesji, ekrany logowania i rejestracji z własnymi komponentami UI, E2E, aplikacje iOS i Android w Capacitorze 8). CI i dokumentacja końcowa dochodzą w kroku 9.

## Wymagania

- Node 24 (`nvm use` czyta `.nvmrc`), npm 11 lub nowszy. Starsze wersje są odrzucane przy `npm install` (`engine-strict`).
- Docker (Docker Desktop lub OrbStack) dla lokalnego PostgreSQL.
- Przed pierwszym uruchomieniem E2E: `npx playwright install`.
- Aplikacje mobilne: macOS z Xcode 26 lub nowszym (iOS), Android Studio 2025.2.1 lub nowsze z emulatorem (Android). Szczegóły w sekcji „Aplikacje mobilne”.

## Pierwsze uruchomienie

```sh
nvm use
npm install
cp .env.example .env
npm run db:up        # PostgreSQL 18 w Dockerze
npm run db:migrate   # migracje (Prisma); nie powinien proponować nowej migracji
npm run db:seed      # konto testowe demo@example.com / starter-password
npm run dev          # PostgreSQL + web (http://localhost:4200) + API (http://localhost:3000/health)
```

Dokumentacja API (OpenAPI generowane z kontraktu): http://localhost:3000/docs.

Jeśli wolumen bazy powstał przed krokiem 5, baza testowa `starter_test` nie istnieje. Utwórz ją raz: `docker compose exec postgres createdb -U starter starter_test` (albo usuń wolumen: `docker compose down -v`).

## Komendy

| Zadanie                       | Komenda                                                              |
| ----------------------------- | -------------------------------------------------------------------- |
| Instalacja                    | `npm install`                                                        |
| Baza, web i API               | `npm run dev`                                                        |
| Aplikacja web                 | `npx nx serve web` (http://localhost:4200)                           |
| API                           | `npx nx serve api` (http://localhost:3000/health)                    |
| PostgreSQL start / stop       | `npm run db:up` / `npm run db:down`                                  |
| Sprawdzenie zmiany            | `npx nx affected -t lint test build`                                 |
| Sprawdzenie wszystkiego       | `npx nx run-many -t lint test build`                                 |
| E2E (mobile i desktop)        | `npx nx e2e web-e2e` (wymaga `npm run db:up`)                        |
| Testy integracyjne API        | `npm run test:integration`                                           |
| Migracja bazy                 | `npm run db:migrate -- --name <zmiana>`, potem `npm run db:generate` |
| Konto testowe                 | `npm run db:seed`                                                    |
| Build mobilny i sync          | `npm run cap:sync` (release, produkcyjne API)                        |
| Otwórz Xcode / Android Studio | `npm run cap:ios` / `npm run cap:android`                            |
| Mobile z lokalnym API         | `npm run cap:ios:dev` / `npm run cap:android:dev`                    |
| Mobile z live reload          | `npm run cap:dev:ios` / `npm run cap:dev:android`                    |
| Graf projektów                | `npx nx graph`                                                       |
| Pliki kontekstu AI            | `npm run ai:sync` / `npm run ai:check`                               |

## Wersje (nx report, 9 października 2026)

| Pakiet     | Wersja                       |
| ---------- | ---------------------------- |
| Node       | 24.21.0                      |
| npm        | 11.21.0                      |
| Nx         | 23.3.0                       |
| Angular    | 22.2.2 (ADR-0009)            |
| TypeScript | 6.0.3                        |
| Vitest     | 4.1.x                        |
| Playwright | 1.64.0                       |
| NestJS     | 11.2.7 (ADR-0010)            |
| PostgreSQL | 18 (Docker)                  |
| Prisma     | 7.10.0 (ADR-0013)            |
| Zod        | 4.6.5, `zod/mini` (ADR-0015) |
| Capacitor  | 8.5.3 (ADR-0016)             |

Aktualizacje wyłącznie przez `npx nx migrate latest`.

## Aplikacje mobilne

Capacitor 8 pakuje build `mobile` aplikacji web w projekty `ios/` i `android/` (PRD, sekcja 6; ADR-0016). Projekty natywne są w repozytorium; zbudowane pliki web (`public/`) i wygenerowane `capacitor.config.json` są ignorowane.

### Przygotowanie (raz)

- **iOS:** Xcode z App Store, potem `xcodebuild -runFirstLaunch` i w Xcode → Settings → Components pobrany symulator iOS. Zależności natywne idą przez Swift Package Manager (CocoaPods nie jest potrzebny).
- **Android:** Android Studio, w nim SDK Manager (Android SDK Platform 36, Build-Tools, Platform-Tools) i Device Manager → emulator z obrazem Google APIs. Gradle i JDK dostarcza Android Studio.

### Uruchomienie na symulatorze i emulatorze z lokalnym API

```sh
npm run dev               # terminal 1: PostgreSQL, API i web
npm run cap:ios:dev       # terminal 2: build mobile-dev, sync, otwiera Xcode → wybierz symulator → Run
npm run cap:android:dev   # albo Android Studio → wybierz emulator → Run
```

- Symulator iOS łączy się z API pod `http://localhost:3000`, emulator Androida pod `http://10.0.2.2:3000` (`apiBaseUrlOverrides` w `apps/web/src/environments/environment.ts`).
- Fizyczne urządzenie potrzebuje adresu IP komputera w sieci lokalnej: wpisz go w `environment.ts` i dopisz pochodzenie do `CORS_ORIGINS` w `.env`, jeśli używasz live reload.
- Live reload: `npm run cap:dev:ios` albo `npm run cap:dev:android` (przy działającym `npm run dev`) instaluje aplikację, która ładuje stronę z `http://localhost:4200`; zmiany w kodzie widać bez przebudowy.
- Debugowanie WebView w buildach `*:dev`: Safari → Develop → symulator, Chrome → `chrome://inspect`.

### Build do sklepu

`npm run cap:sync`, a potem archiwum w Xcode (Product → Archive) albo podpisany bundle w Android Studio (Build → Generate Signed App Bundle). Synchronizacja release wyłącza HTTP, mixed content i debugowanie WebView, które włącza synchronizacja deweloperska (MOB-13). **Zawsze rób ją tuż przed buildem do sklepu.**

Przed pierwszą publikacją:

- Zmień `appId` i `appName` w `capacitor.config.ts` oraz identyfikator w projektach natywnych (Xcode: Bundle Identifier; Android: `applicationId` w `android/app/build.gradle`). Po publikacji identyfikatora nie da się zmienić.
- Wersja: `appVersion` w `environment*.ts`, `MARKETING_VERSION` w Xcode i `versionName` w `android/app/build.gradle` mają tę samą wartość; numer builda (`CURRENT_PROJECT_VERSION`, `versionCode`) rośnie z każdym wydaniem. API może wymusić aktualizację przez `MIN_APP_VERSION_IOS` i `MIN_APP_VERSION_ANDROID` (MOB-11).
- Ikony i splash: `npx @capacitor/assets generate` z plików w `assets/` (narzędzie nie jest zależnością startera).

### Deep linki (MOB-7)

Aplikacja tłumaczy każdy otwierający ją adres na trasę routera: `https://app.example.com/account?tab=1` i `com.example.starter://account?tab=1` prowadzą do `/account?tab=1`. Przechwytywanie adresów nie jest włączone domyślnie:

- **iOS Universal Links:** w Xcode → Signing & Capabilities → Associated Domains dodaj `applinks:app.example.com`, a na serwerze opublikuj `/.well-known/apple-app-site-association` z Team ID i Bundle ID.
- **Android App Links:** w `AndroidManifest.xml` dodaj do `MainActivity` `intent-filter` z `android:autoVerify="true"`, `VIEW`, `BROWSABLE` i `<data android:scheme="https" android:host="app.example.com" />`, a na serwerze opublikuj `/.well-known/assetlinks.json` z odciskiem certyfikatu.
- Własny schemat (`com.example.starter://`) wystarczy do testów: `CFBundleURLTypes` w `Info.plist` i `intent-filter` ze schematem w `AndroidManifest.xml`.

Ścieżki z linków przechodzą przez te same guardy co nawigacja w aplikacji.

### Lista kontrolna na urządzeniu

- [ ] Logowanie i odświeżenie sesji po 15 minutach
- [ ] Sesja zachowana po zamknięciu i ponownym otwarciu aplikacji
- [ ] Po odinstalowaniu i ponownej instalacji aplikacja startuje bez sesji
- [ ] Przycisk wstecz na Androidzie: cofa z ekranu konta, minimalizuje na ekranie głównym i logowania
- [ ] Tryb samolotowy: baner offline, brak awarii; start bez sieci nie wylogowuje
- [ ] Klawiatura nie zasłania aktywnego pola
- [ ] Treść nie wchodzi pod wycięcie ekranu i pasek systemowy; pasek stanu czytelny w motywie jasnym i ciemnym
- [ ] Splash znika dopiero, gdy widać ekran
- [ ] Powrót z tła po godzinie

## Praca z narzędziami AI

Repozytorium jest przygotowane dla Claude Code, Cursora i GitHub Copilota (PRD, sekcja 10; ADR-0008).

- Instrukcje edytujesz tylko w plikach `AGENTS.md`, serwery MCP w `tools/ai/mcp-servers.json`, a skille w `.claude/skills/`. Po zmianie uruchom `npm run ai:sync`.
- `CLAUDE.md`, `.github/copilot-instructions.md`, `.github/instructions/*` i pliki `mcp.json` są generowane. CI sprawdza ich zgodność przez `npm run ai:check`.
- Konfiguracją Nx dla agentów (skille i blok w `AGENTS.md`) zarządza `npx nx configure-ai-agents`.
- Claude Code: przy pierwszym uruchomieniu zaakceptuj plugin Nx z `.claude/settings.json`; daje skille i serwer MCP Nx.
- Cursor i VS Code: serwery MCP (Nx, Angular CLI) włączają się z `.cursor/mcp.json` i `.vscode/mcp.json`.
