# Architektura startera

Ten dokument opisuje, **jak** starter działa i **dlaczego** jest tak zbudowany. Mapa katalogów, lista plików i tabela „gdzie co piszesz” są w [README](../README.md#mapa-repozytorium). Wymagania z identyfikatorami (FE-3, BE-4, MOB-12…) są w [PRD](prd/starter.md), a uzasadnienia pojedynczych decyzji w [ADR-ach](decisions/README.md).

## 1. Zasady

1. **Kontrakt najpierw.** Front i API spotykają się tylko w [`libs/shared/contracts`](../libs/shared/contracts/). Jeden schemat Zod daje typ, walidację żądania w API, walidację formularza i parsowanie odpowiedzi w kliencie. Typów DTO nie powielamy.
2. **Aplikacje składają, biblioteki robią.** `apps/*` zawierają trasy, rejestrację providerów i listę modułów. Logika jest w `libs/*`, które da się testować osobno.
3. **Platforma za interfejsem.** Capacitor i obiekty przeglądarki są tylko w [`libs/web/core/platform`](../libs/web/core/platform/). Reszta frontu nie wie, czy działa w przeglądarce, na iOS czy na Androidzie.
4. **API wersjonowane od pierwszego dnia.** Aplikacji w sklepie nie da się wycofać, więc `/v1` zmienia się tylko przez dodawanie (ADR-0005).
5. **Błąd to dane, nie tekst.** Każda odpowiedź błędu ma kształt `ApiError` z `errorCode`. Klienci reagują na kod, nigdy na treść komunikatu.
6. **Zasady sprawdza maszyna.** Granice modułów, zakazy importów i formatowanie pilnują ESLint, hook przed commitem i CI, a nie pamięć ludzi ani instrukcje dla AI (AI-6).

## 2. Warstwy i granice

Każdy projekt ma dwa tagi w swoim `project.json`. Reguła `@nx/enforce-module-boundaries` w [`eslint.config.mjs`](../eslint.config.mjs) sprawdza każdy import.

| Tag                  | Może importować                                                        |
| -------------------- | ---------------------------------------------------------------------- |
| `scope:web`          | `scope:web`, `scope:shared`                                            |
| `scope:api`          | `scope:api`, `scope:shared`                                            |
| `scope:shared`       | tylko `scope:shared`                                                   |
| `type:app`           | wszystkie typy bibliotek                                               |
| `type:feature` (web) | `ui`, `core`, `contracts`; ekrany nie importują innych ekranów         |
| `type:feature` (api) | `feature`, `data-access`, `util`, `contracts` (moduł auth używa users) |
| `type:ui`            | `ui`, `contracts`                                                      |
| `type:core`          | `core`, `contracts`                                                    |
| `type:data-access`   | `data-access`, `util`, `contracts`                                     |
| `type:util`          | `util`, `contracts`                                                    |
| `type:contracts`     | tylko `contracts`                                                      |

Dodatkowe reguły ESLint:

- `@capacitor/*` oraz `window`, `document`, `localStorage`, `sessionStorage` i `navigator` są zakazane wszędzie poza platformą. Dzięki temu kod jest gotowy na SSR (FE-26, ADR-0006).
- Klasyczny `zod` jest zakazany; obowiązuje `zod/mini` (ADR-0015).
- `any`, `innerHTML`, `outerHTML` i `bypassSecurityTrust*` są zakazane (QA-13).
- Kolejność importów jest stała (QA-6).

Te reguły mają testy regresji w [`tools/lint/lint-rules.spec.mts`](../tools/lint/lint-rules.spec.mts). Gdy ktoś przypadkiem wyłączy regułę, test to wykryje.

## 3. Kontrakt API

- [`api-endpoints.ts`](../libs/shared/contracts/src/lib/api/api-endpoints.ts) wymienia każdy endpoint (`defineEndpoint`: metoda, ścieżka, dostęp, schemat żądania i odpowiedzi). Korzystają z niego trzy strony:
  - `ApiClient` na froncie bierze z niego metodę, ścieżkę i typy, a odpowiedź parsuje schematem;
  - kontroler NestJS waliduje body tym samym schematem (`SchemaValidationPipe`);
  - [`openapi-document.ts`](../libs/api/common/src/lib/openapi/openapi-document.ts) buduje z niego dokumentację pod `/docs`. Dokumentacja nie może się więc rozjechać z kodem.
- Ścieżki są w [`api-routes.ts`](../libs/shared/contracts/src/lib/api/api-routes.ts) (`API_VERSION = '1'`).
- **Zgodność wstecz w ramach `/v1`.** Wolno dodawać endpointy, pola opcjonalne w żądaniu i pola w odpowiedzi; klient pomija nieznane pola (CON-7). Usunięcie pola, zmiana typu albo nowe pole wymagane w żądaniu to `/v2` działające równolegle.
- **Błędy.** Kody są w [`error-code.ts`](../libs/shared/contracts/src/lib/errors/error-code.ts), każdy z przypisanym statusem HTTP. API rzuca `ApiException(code)`, [`api-exception.filter.ts`](../libs/api/common/src/lib/errors/api-exception.filter.ts) zamienia każdy wyjątek (także nieznany) w `ApiError`. Na froncie [`api-error.interceptor.ts`](../libs/web/core/http/src/lib/interceptors/api-error.interceptor.ts) tworzy `ApiRequestError` z kodem albo `NetworkError`, gdy odpowiedź nie dotarła.

## 4. Uwierzytelnianie

Decyzja: tokeny z odświeżaniem zamiast sesji na ciasteczkach, bo aplikacje natywne nie mają wspólnych ciasteczek z witryną (ADR-0004).

| Element                          | Web                                                                 | iOS / Android                                            |
| -------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------- |
| Access token (JWT HS256, 15 min) | pamięć (`SessionService`), nagłówek `Authorization`                 | to samo                                                  |
| Refresh token (32 bajty, 30 dni) | ciasteczko `httpOnly`, `Secure`, `SameSite=Strict`, `Path=/v1/auth` | body odpowiedzi → `SECURE_STORAGE` (Keychain / Keystore) |
| Rozpoznanie platformy przez API  | nagłówek `X-App-Platform: web`                                      | `X-App-Platform: ios` / `android`                        |

Przebieg:

1. **Logowanie i rejestracja.** API zwraca parę tokenów. Hasła są haszowane Argon2id. Dla nieznanego emaila API też liczy hasz, żeby czas odpowiedzi nie zdradzał, czy konto istnieje.
2. **Rotacja.** Każde `POST /v1/auth/refresh` unieważnia stary refresh token i wydaje nowy. W bazie leży tylko skrót SHA-256.
3. **Wykrycie kradzieży.** Ponowne użycie zrotowanego tokenu unieważnia całą rodzinę tokenów użytkownika. Dwa równoległe odświeżenia tym samym tokenem są traktowane tak samo (warunkowy `updateMany`).
4. **Klient.** `refresh()` w [`session.service.ts`](../libs/web/core/auth/src/lib/session/session.service.ts) jest pojedynczym lotem: wiele żądań z `TOKEN_EXPIRED` czeka na jedno odświeżenie, a potem każde jest ponawiane raz.
5. **Start aplikacji.** [`provide-auth.ts`](../libs/web/core/auth/src/lib/provide-auth.ts) przywraca sesję przed pierwszym ekranem. Sesję kończy tylko `REFRESH_TOKEN_INVALID`. Brak sieci zostawia token i ponawia próbę po powrocie połączenia (MOB-10). Po wznowieniu aplikacji z tła wygasły access token jest odświeżany (MOB-6).
6. **Ochrona tras.** Na froncie działają `authGuard` i `guestGuard` (`CanMatchFn`). W API globalny `AccessTokenGuard` wymaga tokenu wszędzie poza metodami z `@Public()`. Limit żądań (`@nestjs/throttler`) dotyczy tylko kontrolera auth.

Warunek wdrożenia: web i API w tej samej witrynie (np. `app.example.com` i `api.example.com`), inaczej `SameSite=Strict` nie wyśle ciasteczka.

## 5. Platforma i aplikacje natywne

- Każda możliwość urządzenia to **interfejs + `InjectionToken`** z trzema implementacjami: web, natywną (Capacitor) i testową. `providePlatform()` raz wybiera web albo natywną przez `Capacitor.isNativePlatform()`.

  | Token               | Web                                      | Native                                                                                                                 |
  | ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
  | `PLATFORM_INFO`     | `web`                                    | `ios` / `android`                                                                                                      |
  | `KEY_VALUE_STORAGE` | localStorage                             | Preferences                                                                                                            |
  | `SECURE_STORAGE`    | pamięć (refresh token jest w ciasteczku) | Keychain / Keystore ([`native-secure-storage.ts`](../libs/web/core/platform/src/lib/storage/native-secure-storage.ts)) |
  | `NETWORK_STATUS`    | `navigator.onLine`                       | `@capacitor/network`                                                                                                   |
  | `APP_LIFECYCLE`     | `visibilitychange`                       | pauza, wznowienie, wstecz, deep linki                                                                                  |
  | `SYSTEM_UI`         | nic                                      | splash, pasek stanu, klawiatura                                                                                        |

- [`provide-native-shell.ts`](../libs/web/core/platform/src/lib/native-shell/provide-native-shell.ts) obsługuje zachowania natywne z PRD 6.4:
  - przycisk wstecz cofa, a na ekranie głównym minimalizuje aplikację;
  - deep link zamienia się w nawigację routera;
  - pole z fokusem przewija się nad klawiaturę;
  - pasek stanu podąża za motywem;
  - splash znika po pierwszym renderze.

  Zależy tylko od tokenów, więc w przeglądarce nic nie robi, a w testach działa na atrapach.

- **Bezpieczeństwo natywne (ADR-0016).**
  - Wpisy w Keychain mają dostęp `whenUnlockedThisDeviceOnly` i nie synchronizują się z iCloud.
  - Po reinstalacji magazyn jest czyszczony (znacznik w Preferences).
  - `allowBackup=false` na Androidzie.
  - HTTP i debugowanie WebView są włączone tylko w buildach `*:dev` (`CAPACITOR_DEV=1`).
- **Buildy.** `production` (web), `mobile` (sklepy, produkcyjne API) i `mobile-dev` (lokalne API) w [`apps/web/project.json`](../apps/web/project.json). Capacitor kopiuje `dist/apps/web-mobile/browser` do `ios/` i `android/`.

## 6. Wersje aplikacji i wymuszona aktualizacja

- Każde żądanie niesie `X-App-Platform` i `X-App-Version` (`appVersion` z `environment*.ts`).
- [`app-version.guard.ts`](../libs/api/common/src/lib/app-version/app-version.guard.ts) porównuje wersję z `MIN_APP_VERSION_<PLATFORMA>`. Za stara aplikacja dostaje `APP_VERSION_UNSUPPORTED`, a front pokazuje ekran `update-required` (MOB-11, CON-6).
- `GET /v1/app/config` zwraca minimalne wersje bez logowania, np. dla ekranu startowego.

## 7. Konfiguracja

- **API:** zmienne środowiskowe są walidowane schematem przy starcie ([`app-config.ts`](../libs/api/common/src/lib/config/app-config.ts)). Brak lub błąd zatrzymuje proces z listą wszystkich problemów naraz (BE-12). Serwisy czytają konfigurację przez token `APP_CONFIG`, nie przez `process.env`.
- **Nx wczytuje `.env` do każdego zadania**, także do serwera Angulara. Nazwy zmiennych API nie mogą kolidować z tym, co czytają narzędzia; stąd `API_PORT` zamiast `PORT`. Job E2E w CI uruchamia się z prawdziwym `.env`, żeby taki konflikt wyszedł automatycznie.
- **Web:** `environment.ts` (lokalnie) i `environment.production.ts` (podmieniany w buildach `production` i `mobile`). Adres API musi być bezwzględny (FE-12).

## 8. Jakość

| Warstwa                    | Co sprawdza                                                                                  | Gdzie                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Testy jednostkowe (Vitest) | Logika bibliotek i aplikacji; próg 80% linii w bibliotekach                                  | `*.spec.ts` obok kodu                                                       |
| Testy integracyjne         | Prawdziwy `AppModule` po HTTP na PostgreSQL                                                  | [`apps/api/src/integration/`](../apps/api/src/integration/)                 |
| E2E (Playwright)           | Rejestracja, logowanie, sesja, wylogowanie, układ; widok mobilny i desktopowy                | [`apps/web-e2e/`](../apps/web-e2e/)                                         |
| Testy narzędzi             | Generator kontekstu AI, reguły lintu                                                         | [`tools/`](../tools/)                                                       |
| Hook przed commitem        | ESLint i Prettier na zmienionych plikach                                                     | [`.husky/pre-commit`](../.husky/pre-commit), `lint-staged` w `package.json` |
| CI                         | Wszystko powyżej plus formatowanie, audyt, skan sekretów, zgodność migracji, sync Capacitora | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)                   |
| Ręcznie                    | Lista kontrolna na urządzeniu                                                                | [README](../README.md#lista-kontrolna-na-urządzeniu)                        |

## 9. Rozszerzanie startera

- Nowy obszar funkcji to nowa biblioteka `feature-*` (web) albo moduł w `libs/api/<obszar>` (API). Przepisy są w [`.claude/skills/`](../.claude/skills/), a ich lista w README.
- Nowa zależność: sprawdź `npm audit --omit=dev --audit-level=high` (ADR-0011). Plugin Capacitora musi mieć tę samą wersję główną co `@capacitor/core`.
- Odstępstwo od zasady z tego dokumentu wymaga nowego ADR-a, a nie wyjątku w lincie.
- Przegląd zmiany pod kątem architektury: skill [`architecture-review`](../.claude/skills/architecture-review/SKILL.md).

## 10. Znane ograniczenia

- **Bundle.** Bundle początkowy web ma 421 kB i przekracza próg ostrzeżenia (300 kB), bo sam Angular z routerem i HTTP go przekracza. Do progu błędu (500 kB) zostaje 79 kB (QA-8, ryzyko R9).
- **Wersje frameworków.** NestJS 11 zamiast 12 (ADR-0010) i Prisma 7 przy zapowiedzianej 8 (ADR-0013). Migracje robimy przez `npx nx migrate latest`, a dostęp do bazy i Capacitora jest zamknięty w jednej bibliotece, żeby zmiana dotyczyła jednego miejsca.
- **Bez natywnej kompilacji w CI.** CI buduje web dla mobile i robi `cap sync`, ale nie kompiluje projektów Xcode ani Gradle. README opisuje, jak to dodać.
