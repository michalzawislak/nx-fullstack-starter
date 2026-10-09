# nx-fullstack-starter

Szablon monorepo: jedna baza kodu dla aplikacji web, aplikacji iOS i Android (Capacitor) oraz API w NestJS z PostgreSQL. Starter nie zawiera logiki biznesowej. Daje konta użytkowników, logowanie z odświeżaniem sesji, obsługę błędów, wersjonowane API i natywną otoczkę mobilną, na których budujesz właściwą aplikację.

- Jak to działa i dlaczego: [`docs/architecture.md`](docs/architecture.md)
- Wymagania i plan budowy: [`docs/prd/starter.md`](docs/prd/starter.md)
- Uzasadnienia decyzji (ADR): [`docs/decisions/`](docs/decisions/README.md)
- Kontekst produktu budowanego na starterze: [`docs/product/`](docs/product/README.md)

> Stan: kroki 1–9 z PRD zaimplementowane. Web, iOS, Android i API z bazą działają, logowanie sprawdzone na wszystkich platformach. Do potwierdzenia: pierwszy zielony przebieg CI na GitHubie ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) i test świeżego klonu w Claude Code, Cursorze i Copilocie.

## Spis treści

1. [Wymagania](#wymagania)
2. [Pierwsze uruchomienie](#pierwsze-uruchomienie)
3. [Codzienna praca](#codzienna-praca)
4. [Jak starter jest zbudowany](#jak-starter-jest-zbudowany)
5. [Mapa repozytorium](#mapa-repozytorium)
6. [Gdzie co piszesz](#gdzie-co-piszesz)
7. [Jak przepływa żądanie: logowanie od ekranu do bazy](#jak-przepływa-żądanie-logowanie-od-ekranu-do-bazy)
8. [Konfiguracja](#konfiguracja)
9. [Testy](#testy)
10. [CI i hook przed commitem](#ci-i-hook-przed-commitem)
11. [Komendy](#komendy)
12. [Wersje](#wersje-nx-report-9-października-2026)
13. [Aplikacje mobilne](#aplikacje-mobilne)
14. [Praca z narzędziami AI](#praca-z-narzędziami-ai)

## Wymagania

- Node 24 (`nvm use` czyta [`.nvmrc`](.nvmrc)), npm 11 lub nowszy. Starsze wersje są odrzucane przy `npm install` (`engine-strict` w [`.npmrc`](.npmrc)). Żeby nie pisać `nvm use` w każdym terminalu: `nvm alias default 24.21.0`.
- Docker (Docker Desktop lub OrbStack) dla lokalnego PostgreSQL.
- Przed pierwszym uruchomieniem E2E: `npx playwright install`.
- Aplikacje mobilne: macOS z Xcode 26 lub nowszym (iOS), Android Studio 2025.2.1 lub nowsze z emulatorem (Android). Szczegóły w sekcji [Aplikacje mobilne](#aplikacje-mobilne).

## Pierwsze uruchomienie

```sh
nvm use
npm install          # instaluje zależności i generuje klienta Prismy (postinstall)
cp .env.example .env
npm run db:up        # PostgreSQL 18 w Dockerze
npm run db:migrate   # migracje (Prisma); nie powinien proponować nowej migracji
npm run db:seed      # konto testowe demo@example.com / starter-password
npm run dev          # PostgreSQL + web (http://localhost:4200) + API (http://localhost:3000/health)
```

Dokumentacja API (OpenAPI generowane z kontraktu): http://localhost:3000/docs.

Jeśli wolumen bazy powstał przed krokiem 5, baza testowa `starter_test` nie istnieje. Utwórz ją raz: `docker compose exec postgres createdb -U starter starter_test` (albo usuń wolumen: `docker compose down -v`).

## Codzienna praca

| Co uruchamiasz       | Gdzie      | Komenda                                                                  |
| -------------------- | ---------- | ------------------------------------------------------------------------ |
| Docker               | aplikacja  | Docker Desktop albo OrbStack musi działać                                |
| Baza, API i web      | terminal 1 | `npm run dev` (zostaw otwarty)                                           |
| Sprawdzenie API      | dowolny    | `curl http://localhost:3000/health` → `"status":"ok"`, `"database":"up"` |
| Aplikacja iOS        | terminal 2 | `npm run cap:ios:dev` → Xcode → symulator → Run                          |
| Aplikacja Android    | terminal 2 | `npm run cap:android:dev` → Android Studio → emulator → Run              |
| Testy przed commitem | terminal 2 | `npx nx affected -t lint test build`                                     |

Zmiana w kodzie frontu jest od razu widoczna w przeglądarce. Aplikacja mobilna zbudowana przez `cap:*:dev` ma kopię frontu, więc po zmianie powtórz komendę albo użyj live reload (`npm run cap:dev:ios`, `npm run cap:dev:android`).

## Jak starter jest zbudowany

To monorepo [Nx](https://nx.dev) z jednym `package.json`. Kod dzieli się na **aplikacje** ([`apps/`](apps/)), które tylko składają całość, i **biblioteki** ([`libs/`](libs/)), w których jest prawie cały kod. Każda biblioteka ma alias importu (`@starter/...` w [`tsconfig.base.json`](tsconfig.base.json)) i dwa tagi: `scope` (web, api, shared) oraz `type` (feature, ui, core, data-access, util, contracts).

```
                       ┌────────────────────────────┐
                       │ libs/shared/contracts      │  schematy Zod: typy, walidacja,
                       │ (scope:shared)             │  lista endpointów, kody błędów
                       └──────────┬─────────────────┘
                 ┌────────────────┴─────────────────┐
     FRONTEND (scope:web)                     BACKEND (scope:api)
     apps/web  ──► Capacitor ──► ios/ android/      apps/api
       │                                              │
       ├─ libs/web/feature-*  ekrany (leniwe)         ├─ libs/api/auth, users  moduły domenowe
       ├─ libs/web/ui         komponenty, style       ├─ libs/api/common       konfiguracja, błędy,
       ├─ libs/web/core/auth  sesja, guardy           │                        walidacja, nagłówki
       ├─ libs/web/core/http  klient API              └─ libs/api/database     Prisma, migracje
       └─ libs/web/core/platform  Capacitor/przeglądarka                      │
                                                                     PostgreSQL (Docker)
```

Zasady, których pilnuje ESLint ([`eslint.config.mjs`](eslint.config.mjs)):

- Frontend i backend nigdy nie importują się nawzajem. Spotykają się tylko w `libs/shared/contracts`.
- Kierunek zależności jest jeden: `feature` → `ui`, `core` → `contracts`. Ekran może użyć komponentu UI i sesji, komponent UI nie zna sesji ani API.
- `@capacitor/*`, `window`, `document`, `localStorage` i `navigator` są dostępne tylko w `libs/web/core/platform`. Reszta frontu dostaje je przez interfejsy i tokeny wstrzykiwania.
- Zod tylko jako `import * as z from 'zod/mini'` (ADR-0015).

Błąd granic modułów naprawiasz przeniesieniem kodu, nie poluzowaniem tagów. Graf zależności: `npx nx graph`.

## Mapa repozytorium

Każdy obszar ma swój `AGENTS.md` z zasadami. To instrukcje dla narzędzi AI, ale czyta się je dobrze także jako krótką dokumentację obszaru.

### Pliki w katalogu głównym

| Plik                                                                                                 | Co w nim jest                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`package.json`](package.json)                                                                       | Wszystkie zależności (jeden plik dla web, API i mobile), skrypty `npm run …`, `overrides` dla poprawek bezpieczeństwa (ADR-0011)                         |
| [`nx.json`](nx.json)                                                                                 | Konfiguracja Nx: domyślne ustawienia generatorów (Vitest, OnPush, SCSS, prefiks `app`), zależności zadań (`build` czeka na wygenerowanie klienta Prismy) |
| [`tsconfig.base.json`](tsconfig.base.json)                                                           | Aliasy `@starter/*` → `libs/*/src/index.ts`, `strict`                                                                                                    |
| [`eslint.config.mjs`](eslint.config.mjs)                                                             | Granice modułów, kolejność importów, zakaz `any`, zakazy Capacitora i globali przeglądarki                                                               |
| [`.prettierrc`](.prettierrc), [`.prettierignore`](.prettierignore), [`.editorconfig`](.editorconfig) | Formatowanie                                                                                                                                             |
| [`.husky/pre-commit`](.husky/pre-commit)                                                             | Hook przed commitem: `lint-staged` (konfiguracja w `package.json`)                                                                                       |
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml)                                               | Pipeline CI (sekcja [CI](#ci-i-hook-przed-commitem))                                                                                                     |
| [`.gitleaks.toml`](.gitleaks.toml)                                                                   | Skan sekretów: reguły domyślne gitleaks i wyjątki dla fałszywych sekretów w testach                                                                      |
| [`.env.example`](.env.example)                                                                       | Wzór zmiennych środowiskowych; kopiujesz do `.env` (nie trafia do gita)                                                                                  |
| [`docker-compose.yml`](docker-compose.yml)                                                           | PostgreSQL 18 do pracy lokalnej; [`tools/docker/postgres-init/`](tools/docker/postgres-init/) tworzy bazę testową                                        |
| [`capacitor.config.ts`](capacitor.config.ts)                                                         | Identyfikator aplikacji, katalog z buildem web, ustawienia pluginów, flagi tylko dla buildów deweloperskich                                              |
| [`vitest.config.mts`](vitest.config.mts)                                                             | Lista projektów Vitesta (każda biblioteka ma własny `vite.config.mts`)                                                                                   |
| [`AGENTS.md`](AGENTS.md)                                                                             | Główne instrukcje dla AI: mapa, komendy, zasady                                                                                                          |

### Aplikacje: [`apps/`](apps/)

| Katalog                         | Co to jest                                                                           | Najważniejsze pliki                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`apps/web`](apps/web/)         | Aplikacja Angular: składa biblioteki w działającą całość, źródło buildu web i mobile | [`app.config.ts`](apps/web/src/app/app.config.ts): rejestracja platformy, HTTP, interceptorów, sesji, otoczki natywnej. [`app.routes.ts`](apps/web/src/app/app.routes.ts): trasy najwyższego poziomu i guardy. [`app.html`](apps/web/src/app/app.html): baner offline i szkielet z nawigacją. [`environments/`](apps/web/src/environments/): adres API i wersja aplikacji. [`project.json`](apps/web/project.json): konfiguracje builda `production`, `mobile`, `mobile-dev`, targety Capacitora |
| [`apps/web-e2e`](apps/web-e2e/) | Testy E2E w Playwright, widok mobilny (Pixel 7) i desktopowy                         | [`playwright.config.mts`](apps/web-e2e/playwright.config.mts): uruchamia API i web. [`src/auth.spec.ts`](apps/web-e2e/src/auth.spec.ts), [`src/layout.spec.ts`](apps/web-e2e/src/layout.spec.ts): scenariusze. [`src/support/`](apps/web-e2e/src/support/): pomocnicze logowanie i rozmiary ekranu                                                                                                                                                                                               |
| [`apps/api`](apps/api/)         | Aplikacja NestJS: składa moduły API, konfiguruje HTTP                                | [`main.ts`](apps/api/src/main.ts): start, wczytanie `.env`. [`app/app.module.ts`](apps/api/src/app/app.module.ts): lista modułów. [`app/configure-app.ts`](apps/api/src/app/configure-app.ts): helmet, CORS, ciasteczka, wersjonowanie `/v1`, Swagger. [`app/health/`](apps/api/src/app/health/): `GET /health`. [`src/integration/`](apps/api/src/integration/): testy integracyjne na prawdziwej bazie. [`src/testing/`](apps/api/src/testing/): ich środowisko                                |

### Biblioteka wspólna: [`libs/shared/contracts`](libs/shared/contracts/)

Kontrakt między frontem a API. Jeden schemat Zod daje typ TypeScript, walidację w API i walidację formularza.

| Plik / katalog                                                                                                                                                                                     | Co w nim jest                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| [`api/api-endpoints.ts`](libs/shared/contracts/src/lib/api/api-endpoints.ts)                                                                                                                       | **Spis wszystkich endpointów**: metoda, ścieżka, dostęp, schemat żądania i odpowiedzi. Z niego korzysta klient na froncie i generator OpenAPI |
| [`api/api-routes.ts`](libs/shared/contracts/src/lib/api/api-routes.ts)                                                                                                                             | Wersja API (`1`), ścieżki kontrolerów i pełne ścieżki, nazwa ciasteczka z refresh tokenem                                                     |
| [`api/app-headers.ts`](libs/shared/contracts/src/lib/api/app-headers.ts)                                                                                                                           | Nagłówki `X-App-Platform` i `X-App-Version`, porównywanie wersji                                                                              |
| [`api/endpoint.ts`](libs/shared/contracts/src/lib/api/endpoint.ts)                                                                                                                                 | Typy `defineEndpoint`, `EndpointRequest`, `EndpointResponse`                                                                                  |
| [`errors/`](libs/shared/contracts/src/lib/errors/)                                                                                                                                                 | Kody błędów (`errorCode`) z kodami HTTP i kształt `ApiError`                                                                                  |
| [`auth/`](libs/shared/contracts/src/lib/auth/), [`users/`](libs/shared/contracts/src/lib/users/), [`app/`](libs/shared/contracts/src/lib/app/), [`health/`](libs/shared/contracts/src/lib/health/) | Schematy żądań i odpowiedzi, po jednym pliku `*.contract.ts` na temat                                                                         |
| [`zod-config.ts`](libs/shared/contracts/src/lib/zod-config.ts)                                                                                                                                     | Angielskie komunikaty Zoda                                                                                                                    |

### Frontend: [`libs/web/`](libs/web/)

| Biblioteka                                 | Odpowiada za                                                                                                                           | Najważniejsze pliki                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`core/platform`](libs/web/core/platform/) | Jedyne miejsce z Capacitorem i obiektami przeglądarki. Każda możliwość urządzenia to interfejs + token + wersja web, natywna i testowa | [`provide-platform.ts`](libs/web/core/platform/src/lib/provide-platform.ts): wybór web/native. [`storage/`](libs/web/core/platform/src/lib/storage/): `KEY_VALUE_STORAGE` (ustawienia) i `SECURE_STORAGE` (Keychain/Keystore). [`network/`](libs/web/core/platform/src/lib/network/): `NETWORK_STATUS`. [`lifecycle/`](libs/web/core/platform/src/lib/lifecycle/): pauza, wznowienie, przycisk wstecz, deep linki. [`platform-info/`](libs/web/core/platform/src/lib/platform-info/): web/ios/android. [`system-ui/`](libs/web/core/platform/src/lib/system-ui/): splash, pasek stanu, klawiatura. [`native-shell/`](libs/web/core/platform/src/lib/native-shell/): zachowania natywne. [`testing/`](libs/web/core/platform/src/lib/testing/): atrapy do testów |
| [`core/http`](libs/web/core/http/)         | Komunikacja z API                                                                                                                      | [`api-client.service.ts`](libs/web/core/http/src/lib/api-client.service.ts): `ApiClient.request(API_ENDPOINTS.x.y, body)`, typy i parsowanie z kontraktu. [`api-config.ts`](libs/web/core/http/src/lib/api-config.ts): adres API. [`interceptors/`](libs/web/core/http/src/lib/interceptors/): nagłówki aplikacji, mapowanie błędów, wymuszona aktualizacja. [`errors/`](libs/web/core/http/src/lib/errors/): `ApiRequestError`, `NetworkError`                                                                                                                                                                                                                                                                                                                 |
| [`core/auth`](libs/web/core/auth/)         | Sesja użytkownika                                                                                                                      | [`session/session.service.ts`](libs/web/core/auth/src/lib/session/session.service.ts): stan sesji w sygnałach, logowanie, odświeżanie, wylogowanie. [`session/refresh-token-store.ts`](libs/web/core/auth/src/lib/session/refresh-token-store.ts): gdzie leży refresh token. [`interceptors/auth.interceptor.ts`](libs/web/core/auth/src/lib/interceptors/auth.interceptor.ts): nagłówek `Authorization`, odświeżenie przy `TOKEN_EXPIRED`. [`guards/`](libs/web/core/auth/src/lib/guards/): `authGuard`, `guestGuard`. [`provide-auth.ts`](libs/web/core/auth/src/lib/provide-auth.ts): przywrócenie sesji przy starcie                                                                                                                                        |
| [`ui`](libs/web/ui/)                       | Komponenty prezentacyjne i style; nie zna API ani sesji                                                                                | [`styles/_tokens.scss`](libs/web/ui/src/styles/_tokens.scss): kolory, odstępy, breakpointy, motyw jasny i ciemny. [`styles/_safe-area.scss`](libs/web/ui/src/styles/_safe-area.scss): wycięcia ekranu. [`lib/button/`](libs/web/ui/src/lib/button/), [`lib/text-field/`](libs/web/ui/src/lib/text-field/), [`lib/offline-banner/`](libs/web/ui/src/lib/offline-banner/), [`lib/app-shell/`](libs/web/ui/src/lib/app-shell/) (dolny pasek na telefonie, panel boczny od 768 px)                                                                                                                                                                                                                                                                                  |
| [`feature-auth`](libs/web/feature-auth/)   | Ekrany logowania i rejestracji (ładowane leniwie)                                                                                      | [`login/`](libs/web/feature-auth/src/lib/login/), [`register/`](libs/web/feature-auth/src/lib/register/): strony z Signal Forms. [`shared/auth-error-message.ts`](libs/web/feature-auth/src/lib/shared/auth-error-message.ts): komunikaty po `errorCode`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| [`feature-home`](libs/web/feature-home/)   | Przykładowe ekrany po zalogowaniu (wzór dla Twoich funkcji)                                                                            | [`home.routes.ts`](libs/web/feature-home/src/lib/home.routes.ts): trasy `/` i `/account`. [`home/`](libs/web/feature-home/src/lib/home/), [`account/`](libs/web/feature-home/src/lib/account/): strony. [`current-user.ts`](libs/web/feature-home/src/lib/current-user.ts): `rxResource` na `GET /v1/users/me`                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### Backend: [`libs/api/`](libs/api/)

| Biblioteka                       | Odpowiada za                                     | Najważniejsze pliki                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`common`](libs/api/common/)     | Infrastruktura wspólna dla modułów               | [`config/app-config.ts`](libs/api/common/src/lib/config/app-config.ts): walidacja zmiennych środowiskowych przy starcie, token `APP_CONFIG`. [`errors/`](libs/api/common/src/lib/errors/): `ApiException` i filtr zamieniający każdy błąd w `ApiError`. [`validation/schema-validation.pipe.ts`](libs/api/common/src/lib/validation/schema-validation.pipe.ts): walidacja body schematem z kontraktu. [`http/`](libs/api/common/src/lib/http/): `@Public()`, `@CurrentUser()`, rozpoznanie platformy, logowanie żądań z `X-Request-Id`. [`app-version/`](libs/api/common/src/lib/app-version/): minimalna wersja aplikacji i `GET /v1/app/config`. [`openapi/`](libs/api/common/src/lib/openapi/): dokument OpenAPI z kontraktu |
| [`database`](libs/api/database/) | Dostęp do PostgreSQL przez Prismę                | [`prisma/schema.prisma`](libs/api/database/prisma/schema.prisma): **model danych** (tabele `users`, `refresh_tokens`). [`prisma/migrations/`](libs/api/database/prisma/migrations/): migracje SQL. [`prisma/seed.ts`](libs/api/database/prisma/seed.ts): konto testowe. [`prisma.config.ts`](libs/api/database/prisma.config.ts): konfiguracja CLI. [`src/lib/prisma.service.ts`](libs/api/database/src/lib/prisma.service.ts): klient wstrzykiwany do serwisów. Klient generuje się do `src/generated/` (poza gitem)                                                                                                                                                                                                           |
| [`auth`](libs/api/auth/)         | Rejestracja, logowanie, odświeżanie, wylogowanie | [`auth.controller.ts`](libs/api/auth/src/lib/auth.controller.ts): endpointy `/v1/auth/*`. [`auth.service.ts`](libs/api/auth/src/lib/auth.service.ts): logika. [`password-hasher.service.ts`](libs/api/auth/src/lib/password-hasher.service.ts): Argon2id. [`token.service.ts`](libs/api/auth/src/lib/token.service.ts): JWT. [`refresh-token.service.ts`](libs/api/auth/src/lib/refresh-token.service.ts): rotacja i unieważnianie. [`refresh-token-transport.ts`](libs/api/auth/src/lib/refresh-token-transport.ts): ciasteczko na web, body na mobile. [`access-token.guard.ts`](libs/api/auth/src/lib/access-token.guard.ts): globalny guard; wszystko wymaga logowania poza `@Public()`                                     |
| [`users`](libs/api/users/)       | Użytkownicy                                      | [`users.service.ts`](libs/api/users/src/lib/users.service.ts): tworzenie i odczyt, `toPublicUser` (bez hasła). [`users.controller.ts`](libs/api/users/src/lib/users.controller.ts): `GET /v1/users/me`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

### Mobile: [`ios/`](ios/) i [`android/`](android/)

Projekty natywne wygenerowane przez Capacitora, trzymane w gicie. Edytujesz je w Xcode i Android Studio tylko wtedy, gdy potrzebujesz natywnych ustawień:

- **iOS:** [`ios/App/App/Info.plist`](ios/App/App/Info.plist) (uprawnienia, schematy URL), wersja i Bundle ID w ustawieniach targetu App w Xcode.
- **Android:** [`android/app/src/main/AndroidManifest.xml`](android/app/src/main/AndroidManifest.xml) (uprawnienia, deep linki), wersja i `applicationId` w [`android/app/build.gradle`](android/app/build.gradle).

Katalogi `public/` z buildem web i `capacitor.config.json` są generowane przez `cap sync` i ignorowane przez gita.

### Dokumentacja i narzędzia

| Katalog                                        | Co w nim jest                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/architecture.md`](docs/architecture.md) | Zasady, warstwy i granice, kontrakt, uwierzytelnianie, platforma, błędy, konfiguracja, jakość                                                                                                                                                                                                                                 |
| [`docs/prd/`](docs/prd/)                       | PRD: wymagania z identyfikatorami (FE-3, BE-4, MOB-12…), plan budowy, uwagi z wykonania kroków                                                                                                                                                                                                                                |
| [`docs/decisions/`](docs/decisions/)           | ADR-y: dlaczego wybraliśmy dane rozwiązanie. Zmiana decyzji to nowy ADR ([szablon](docs/decisions/0000-szablon.md))                                                                                                                                                                                                           |
| [`docs/product/`](docs/product/)               | Pusty w starterze; tu opisujesz produkt, który budujesz (domena, słownik pojęć, użytkownicy)                                                                                                                                                                                                                                  |
| [`tools/`](tools/)                             | Narzędzia repozytorium jako projekt Nx `tools` z testami. [`ai/sync.mts`](tools/ai/sync.mts): generator plików dla Claude Code, Cursora i Copilota. [`ai/mcp-servers.json`](tools/ai/mcp-servers.json): serwery MCP. [`lint/lint-rules.spec.mts`](tools/lint/lint-rules.spec.mts): testy reguł lintu pilnujących architektury |
| [`.claude/skills/`](.claude/skills/)           | Przepisy krok po kroku dla typowych zadań (czytane przez wszystkie trzy narzędzia AI, przydatne też dla ludzi)                                                                                                                                                                                                                |

## Gdzie co piszesz

| Chcesz…                                               | Gdzie                                                                                                                                                                                                                                                                         | Przepis                                                                      |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Dodać nowy ekran albo obszar aplikacji                | Nowa biblioteka `libs/web/feature-<nazwa>`, trasa w [`app.routes.ts`](apps/web/src/app/app.routes.ts)                                                                                                                                                                         | [`add-web-feature`](.claude/skills/add-web-feature/SKILL.md)                 |
| Dodać ekran do istniejącego obszaru                   | Strona w `libs/web/feature-<nazwa>/src/lib/<ekran>/`, trasa w `<nazwa>.routes.ts` (wzór: [`home.routes.ts`](libs/web/feature-home/src/lib/home.routes.ts))                                                                                                                    | [`add-web-feature`](.claude/skills/add-web-feature/SKILL.md)                 |
| Dodać endpoint API                                    | 1. Schemat w `libs/shared/contracts/src/lib/<temat>/`. 2. Wpis w [`api-endpoints.ts`](libs/shared/contracts/src/lib/api/api-endpoints.ts) i ścieżka w [`api-routes.ts`](libs/shared/contracts/src/lib/api/api-routes.ts). 3. Metoda w kontrolerze modułu w `libs/api/<moduł>` | [`add-endpoint`](.claude/skills/add-endpoint/SKILL.md)                       |
| Dodać nowy obszar biznesowy w API (np. zamówienia)    | Nowa biblioteka `libs/api/<obszar>` z modułem, kontrolerem i serwisem; moduł dopisany w [`app.module.ts`](apps/api/src/app/app.module.ts)                                                                                                                                     | [`add-api-module`](.claude/skills/add-api-module/SKILL.md)                   |
| Zmienić tabelę albo dodać nową                        | [`schema.prisma`](libs/api/database/prisma/schema.prisma), potem `npm run db:migrate -- --name <zmiana>`                                                                                                                                                                      | [`db-migration`](.claude/skills/db-migration/SKILL.md)                       |
| Dodać kod błędu                                       | [`errors/error-code.ts`](libs/shared/contracts/src/lib/errors/error-code.ts); w API rzucasz `ApiException`, na froncie reagujesz na `errorCode`                                                                                                                               | [`add-endpoint`](.claude/skills/add-endpoint/SKILL.md)                       |
| Dodać funkcję urządzenia (aparat, push, lokalizacja…) | Interfejs, token i implementacje w [`libs/web/core/platform`](libs/web/core/platform/), uprawnienia w `ios/` i `android/`                                                                                                                                                     | [`add-platform-capability`](.claude/skills/add-platform-capability/SKILL.md) |
| Dodać lub zmienić komponent wizualny                  | [`libs/web/ui/src/lib/`](libs/web/ui/src/lib/), eksport w [`index.ts`](libs/web/ui/src/index.ts)                                                                                                                                                                              | [`libs/web/ui/AGENTS.md`](libs/web/ui/AGENTS.md)                             |
| Zmienić kolory, odstępy, czcionki, breakpointy        | [`_tokens.scss`](libs/web/ui/src/styles/_tokens.scss) (jedyne miejsce na te wartości)                                                                                                                                                                                         | —                                                                            |
| Zmienić adres API dla web lub mobile                  | [`environment.ts`](apps/web/src/environments/environment.ts) (lokalnie), [`environment.production.ts`](apps/web/src/environments/environment.production.ts) (produkcja)                                                                                                       | [Konfiguracja](#konfiguracja)                                                |
| Dodać zmienną środowiskową API                        | Schemat w [`app-config.ts`](libs/api/common/src/lib/config/app-config.ts) i wpis w [`.env.example`](.env.example); odczyt przez token `APP_CONFIG`                                                                                                                            | [Konfiguracja](#konfiguracja)                                                |
| Zrobić endpoint publiczny (bez logowania)             | Dekorator `@Public()` na metodzie kontrolera                                                                                                                                                                                                                                  | [`add-endpoint`](.claude/skills/add-endpoint/SKILL.md)                       |
| Odczytać zalogowanego użytkownika w API               | Parametr `@CurrentUser()` (wzór: [`users.controller.ts`](libs/api/users/src/lib/users.controller.ts))                                                                                                                                                                         | —                                                                            |
| Odczytać sesję na froncie                             | `inject(SessionService)`: sygnały `isAuthenticated`, `status`                                                                                                                                                                                                                 | [`libs/web/core/auth/AGENTS.md`](libs/web/core/auth/AGENTS.md)               |
| Zapisać ustawienie użytkownika na urządzeniu          | `inject(KEY_VALUE_STORAGE)`. Sekrety tylko w `SECURE_STORAGE`                                                                                                                                                                                                                 | [`libs/web/core/platform/AGENTS.md`](libs/web/core/platform/AGENTS.md)       |
| Opisać produkt dla siebie i AI                        | [`docs/product/`](docs/product/README.md)                                                                                                                                                                                                                                     | —                                                                            |
| Zapisać decyzję architektoniczną                      | Nowy plik w [`docs/decisions/`](docs/decisions/README.md)                                                                                                                                                                                                                     | [szablon](docs/decisions/0000-szablon.md)                                    |
| Sprawdzić zmianę pod kątem architektury               | Lista kontrolna w skillu                                                                                                                                                                                                                                                      | [`architecture-review`](.claude/skills/architecture-review/SKILL.md)         |
| Dodać regułę lintu pilnującą architektury             | [`eslint.config.mjs`](eslint.config.mjs) i przypadek testowy w [`lint-rules.spec.mts`](tools/lint/lint-rules.spec.mts)                                                                                                                                                        | [`tools/AGENTS.md`](tools/AGENTS.md)                                         |
| Zmienić instrukcje dla AI                             | `AGENTS.md` w danym obszarze, potem `npm run ai:sync`                                                                                                                                                                                                                         | [Praca z narzędziami AI](#praca-z-narzędziami-ai)                            |

Zasada ogólna: aplikacje w `apps/` tylko składają całość (trasy, rejestracja providerów, lista modułów). Logika trafia do bibliotek.

## Jak przepływa żądanie: logowanie od ekranu do bazy

Prześledź to raz w kodzie, a każda nowa funkcja będzie wyglądała tak samo.

**Frontend**

1. [`login.page.ts`](libs/web/feature-auth/src/lib/login/login.page.ts): formularz Signal Forms waliduje dane schematem `loginRequestSchema` z [kontraktu](libs/shared/contracts/src/lib/auth/login.contract.ts), tym samym, którego używa API. Po wysłaniu woła `SessionService.login()`.
2. [`session.service.ts`](libs/web/core/auth/src/lib/session/session.service.ts) woła `ApiClient.request(API_ENDPOINTS.auth.login, credentials)`.
3. [`api-client.service.ts`](libs/web/core/http/src/lib/api-client.service.ts) bierze metodę i ścieżkę z [`api-endpoints.ts`](libs/shared/contracts/src/lib/api/api-endpoints.ts) i składa adres z adresem API z [`environment.ts`](apps/web/src/environments/environment.ts).
4. Interceptory z [`app.config.ts`](apps/web/src/app/app.config.ts) po kolei:
   - [`app-headers.interceptor.ts`](libs/web/core/http/src/lib/interceptors/app-headers.interceptor.ts) dodaje `X-App-Platform` i `X-App-Version`;
   - [`app-version.interceptor.ts`](libs/web/core/http/src/lib/interceptors/app-version.interceptor.ts) przy `APP_VERSION_UNSUPPORTED` przekierowuje na ekran aktualizacji;
   - [`auth.interceptor.ts`](libs/web/core/auth/src/lib/interceptors/auth.interceptor.ts) dodaje `Authorization: Bearer …`, a przy `TOKEN_EXPIRED` odświeża sesję i ponawia żądanie;
   - [`api-error.interceptor.ts`](libs/web/core/http/src/lib/interceptors/api-error.interceptor.ts) zamienia błąd HTTP na `ApiRequestError` z `errorCode` albo na `NetworkError` (brak połączenia).

**Backend**

5. [`configure-app.ts`](apps/api/src/app/configure-app.ts): CORS, ciasteczka, prefiks wersji `/v1`.
6. [`app-version.guard.ts`](libs/api/common/src/lib/app-version/app-version.guard.ts) sprawdza minimalną wersję aplikacji, a [`access-token.guard.ts`](libs/api/auth/src/lib/access-token.guard.ts) przepuszcza, bo login ma `@Public()`.
7. [`auth.controller.ts`](libs/api/auth/src/lib/auth.controller.ts): `SchemaValidationPipe` sprawdza body tym samym `loginRequestSchema`. Zły kształt kończy się `VALIDATION_FAILED`.
8. [`auth.service.ts`](libs/api/auth/src/lib/auth.service.ts) szuka użytkownika przez [`users.service.ts`](libs/api/users/src/lib/users.service.ts) i [`prisma.service.ts`](libs/api/database/src/lib/prisma.service.ts), sprawdza hasło ([`password-hasher.service.ts`](libs/api/auth/src/lib/password-hasher.service.ts)), wystawia JWT ([`token.service.ts`](libs/api/auth/src/lib/token.service.ts)) i refresh token ([`refresh-token.service.ts`](libs/api/auth/src/lib/refresh-token.service.ts), w bazie tylko skrót).
9. [`refresh-token-transport.ts`](libs/api/auth/src/lib/refresh-token-transport.ts): przeglądarka dostaje refresh token w ciasteczku `httpOnly`, aplikacja natywna w body odpowiedzi.
10. Każdy błąd przechodzi przez [`api-exception.filter.ts`](libs/api/common/src/lib/errors/api-exception.filter.ts) i ma kształt `{ errorCode, message, … }`.

**Z powrotem na froncie**

11. `ApiClient` parsuje odpowiedź schematem `tokenPairSchema`. `SessionService` trzyma access token tylko w pamięci, a refresh token na mobile zapisuje [`refresh-token-store.ts`](libs/web/core/auth/src/lib/session/refresh-token-store.ts) w `SECURE_STORAGE` (Keychain/Keystore).
12. Przy następnym starcie [`provide-auth.ts`](libs/web/core/auth/src/lib/provide-auth.ts) przywraca sesję przez `POST /v1/auth/refresh`, zanim pojawi się pierwszy ekran. Dlatego sesja przetrwa restart aplikacji.

## Konfiguracja

### Zmienne środowiskowe API ([`.env.example`](.env.example))

API sprawdza je przy starcie w [`app-config.ts`](libs/api/common/src/lib/config/app-config.ts) i zatrzymuje się z listą problemów, jeśli czegoś brakuje.

| Zmienna                                     | Domyślnie                       | Znaczenie                                                                                                                                      |
| ------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                  | `development`                   | `production` włącza logi JSON i CSP, wyłącza Swagger UI                                                                                        |
| `API_PORT`                                  | `3000`                          | Port API. Nie `PORT`, bo Nx przekazuje `.env` do wszystkich zadań, a serwer Angulara też czyta `PORT`. `PORT` działa jako zapasowy na hostingu |
| `DATABASE_URL`                              | — (wymagana)                    | Połączenie z PostgreSQL                                                                                                                        |
| `JWT_ACCESS_SECRET`                         | — (wymagana)                    | Min. 32 losowe znaki (`openssl rand -base64 48`)                                                                                               |
| `JWT_ACCESS_TTL_SECONDS`                    | `900`                           | Ważność access tokenu (15 min)                                                                                                                 |
| `REFRESH_TOKEN_TTL_DAYS`                    | `30`                            | Ważność refresh tokenu                                                                                                                         |
| `CORS_ORIGINS`                              | web dev + WebView iOS i Android | Dozwolone pochodzenia, po przecinku                                                                                                            |
| `AUTH_RATE_LIMIT_PER_MINUTE`                | `20`                            | Limit żądań do `/v1/auth/*`                                                                                                                    |
| `MIN_APP_VERSION_WEB` / `_IOS` / `_ANDROID` | `0.0.0`                         | Starsze aplikacje dostają `APP_VERSION_UNSUPPORTED` i ekran aktualizacji                                                                       |
| `POSTGRES_*`                                | `starter`                       | Użytkownik, hasło, baza i port kontenera z `docker-compose.yml`                                                                                |
| `TEST_DATABASE_URL`                         | `…/starter_test`                | Baza testów integracyjnych (nazwa musi kończyć się na `_test`)                                                                                 |
| `SEED_USER_EMAIL`, `SEED_USER_PASSWORD`     | konto demo                      | Konto tworzone przez `npm run db:seed`                                                                                                         |

### Frontend ([`apps/web/src/environments/`](apps/web/src/environments/))

| Plik                                                                               | Używany przez                                | Co ustawiasz                                                                                       |
| ---------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [`environment.ts`](apps/web/src/environments/environment.ts)                       | `nx serve web`, build `mobile-dev`           | `apiBaseUrl` (lokalne API), `apiBaseUrlOverrides.android` (`10.0.2.2` dla emulatora), `appVersion` |
| [`environment.production.ts`](apps/web/src/environments/environment.production.ts) | build `production` (web) i `mobile` (sklepy) | Prawdziwy adres API, `appVersion`                                                                  |

Pliki podmienia `fileReplacements` w [`apps/web/project.json`](apps/web/project.json). Web i API na produkcji muszą działać w tej samej witrynie (np. `app.example.com` i `api.example.com`), inaczej przeglądarka nie wyśle ciasteczka z refresh tokenem.

## Testy

| Rodzaj                         | Gdzie leżą                                                                                    | Uruchomienie                                                 |
| ------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Jednostkowe                    | Obok kodu, `*.spec.ts` w każdej bibliotece i aplikacji                                        | `npx nx test <projekt>`, wszystko: `npx nx run-many -t test` |
| Integracyjne API               | [`apps/api/src/integration/`](apps/api/src/integration/) (prawdziwe API po HTTP i PostgreSQL) | `npm run test:integration` (wymaga `npm run db:up`)          |
| E2E                            | [`apps/web-e2e/src/`](apps/web-e2e/src/) (Playwright, widok mobilny i desktopowy)             | `npx nx e2e web-e2e`                                         |
| Narzędzia                      | [`tools/`](tools/) (generator kontekstu AI, reguły lintu)                                     | `npx nx test tools`                                          |
| Zgodność migracji ze schematem | `schema.prisma` kontra baza po migracjach                                                     | `npm run db:check` (wymaga `npm run db:up`)                  |
| Na urządzeniu                  | Lista kontrolna w sekcji [Aplikacje mobilne](#lista-kontrolna-na-urządzeniu)                  | ręcznie                                                      |

- Każdy test ma układ Arrange / Act / Assert. Próg pokrycia linii to 80% (konfiguracja w `vite.config.mts` biblioteki).
- Na froncie testujesz z atrapami platformy: `providePlatformTesting()` z [`platform-testing.ts`](libs/web/core/platform/src/lib/testing/platform-testing.ts). W `core/auth` i `core/http` są gotowe pomocnicze `testing.spec-helpers.ts`.
- W API testy jednostkowe używają atrap repozytoriów (wzór: [`in-memory-refresh-tokens.ts`](libs/api/auth/src/lib/testing/in-memory-refresh-tokens.ts)), a integracyjne używają [`test-app.ts`](apps/api/src/testing/test-app.ts).

## CI i hook przed commitem

**Hook przed commitem** ([`.husky/pre-commit`](.husky/pre-commit)) uruchamia ESLint z poprawkami i Prettiera na plikach w commicie (`lint-staged`). Instaluje się sam przy `npm install` (skrypt `prepare`). Commit z błędem lintu zostaje zatrzymany. Pominięcie hooka (`git commit --no-verify`) niczego nie ułatwia, bo CI sprawdza to samo.

**CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) działa przy każdym pull requeście i pushu do `main`. Ma pięć równoległych jobów:

| Job                                | Co sprawdza                                                                                                                                                                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lint, typecheck, unit tests, build | `nx affected -t lint typecheck build` i `nx affected -t test --coverage` (tylko projekty dotknięte zmianą; progi pokrycia przerywają job), `format:check`, `ai:check`, `npm audit --omit=dev --audit-level=high` (pełny audyt tylko jako raport) |
| Secret scan                        | gitleaks po całej historii (`.gitleaks.toml`)                                                                                                                                                                                                    |
| API integration tests              | Testy integracyjne na PostgreSQL 18, potem `db:check`: czy migracje odpowiadają `schema.prisma`                                                                                                                                                  |
| E2E                                | Playwright w widoku mobilnym i desktopowym. Startuje z prawdziwym `.env` z `.env.example`, więc wyłapie zmienną, która trafi do złego procesu (jak `PORT`)                                                                                       |
| Mobile                             | Build `mobile` i `cap sync` bez kompilacji natywnej; projekty `ios/` i `android/` w gicie muszą odpowiadać zainstalowanym pluginom                                                                                                               |

Żeby wymagać zielonego CI przed scaleniem: GitHub → Settings → Branches → reguła dla `main` → „Require status checks to pass” i zaznacz te pięć jobów.

**Kompilacja natywna w CI (poza zakresem startera).** Dodaj job na `macos-latest`: `npm ci`, `npm run cap:sync`, potem `xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO build`. Dla Androida wystarczy job na `ubuntu-latest` z `actions/setup-java` (JDK 21) i `./gradlew assembleDebug` w `android/`. Podpisywanie i publikację w sklepach najprościej zrobić przez fastlane z certyfikatami w sekretach repozytorium.

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
| Formatowanie                  | `npm run format` / `npm run format:check`                            |
| Migracje kontra schemat       | `npm run db:check`                                                   |
| Testy narzędzi                | `npx nx test tools`                                                  |
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
