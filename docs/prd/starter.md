# PRD: Starter Nx + Angular + NestJS + PostgreSQL + Capacitor

Oct 9, 2026 · @Michał Zawiślak · wersja 3: wyniki kroku 1 (wersje, generatory Nx, kontekst AI)

## 1. Cel i zakres

Starter to szablon monorepo, z którego jedną bazą kodu powstaje aplikacja webowa, aplikacje iOS i Android oraz backend API. Konkretna aplikacja nie jest jeszcze znana, więc starter ma niczego nie zamykać i nie narzucać decyzji produktowych.

**W zakresie**

- Aplikacja Angular działająca w przeglądarce i w powłoce Capacitor.
- API w NestJS z bazą PostgreSQL.
- Współdzielone typy i walidacja między frontendem a backendem.
- Abstrakcje platformy dla storage, sieci i cyklu życia aplikacji.
- Uwierzytelnianie na tokenach z odświeżaniem, działające na web i mobile.
- Layout mobile-first z obsługą safe areas.
- Lint, testy, CI i lokalne środowisko uruchamiane jedną komendą.
- Kontekst dla narzędzi AI (Claude Code, Cursor, GitHub Copilot): instrukcje, skille i konfiguracja MCP z jednego źródła (sekcja 10).

**Poza zakresem (dodawane w konkretnej aplikacji)**

- Konkretne pluginy natywne: push, kamera, biometria, płatności.
- Biblioteka komponentów UI (Ionic kontra własne komponenty).
- Publikacja w sklepach, podpisywanie aplikacji, live updates.
- Logika biznesowa i model domeny.
- Logowanie społecznościowe (OAuth).

**Kryterium sukcesu:** po sklonowaniu repozytorium `npm install` i jedna komenda uruchamiają web, API i bazę, a druga buduje aplikację na emulator iOS lub Android, z działającym logowaniem na każdej z platform. Claude Code, Cursor i Copilot otwarte na świeżym klonie widzą te same instrukcje i skille bez ręcznej konfiguracji.

## 2. Podjęte decyzje

| Obszar | Decyzja | Uzasadnienie | Odrzucone |
| --- | --- | --- | --- |
| Mobile | Capacitor | Jedna baza kodu z webem, zerowy koszt nauki, publikacja w App Store i Google Play. Mobile jest opcjonalną warstwą, a nie fundamentem. | NativeScript (osobne widoki, mała społeczność), Flutter (Dart, brak współdzielenia kodu z Angularem), samo PWA (bez sklepów, ograniczone API na iOS) |
| Backend | NestJS | Architektura jak w Angularze (moduły, DI, dekoratory, guardy), pełna kontrola nad logiką i uprawnieniami. | Supabase jako cały backend (logika rozproszona między RLS, funkcje SQL i edge functions) |
| Baza | PostgreSQL | Standard, dojrzałe narzędzia, łatwy hosting. | — |
| Repozytorium | Monorepo Nx | Współdzielone typy i walidacja; zmiana kontraktu API wywołuje błędy kompilacji po obu stronach. | Osobne repozytoria |
| Auth | Tokeny z odświeżaniem | Ciasteczka sesyjne zawodzą w WebView; origin aplikacji to `capacitor://localhost` (iOS) lub `https://localhost` (Android). | Sesje na ciasteczkach |
| API | Wersjonowane od pierwszego dnia (`/v1`) | Starych wersji aplikacji ze sklepu nie da się wycofać. | Brak wersjonowania |
| Renderowanie web | Bez SSR, kod gotowy na SSR (FE-26) | Starter to aplikacja za logowaniem: SSR nie zna sesji (access token w pamięci, ciasteczko ograniczone do `/v1/auth`), więc daje mało, a kosztuje drugą ścieżkę builda, trzecią implementację abstrakcji i serwer Node. Mobile i tak wymaga buildu statycznego. SSR można dodać później generatorem `setup-ssr`. | SSR od początku; publiczne strony pod SEO lepiej robić osobno |
| Menedżer pakietów | npm | Zero konfiguracji, dokumentacja Capacitora, NestJS i Prismy zakłada npm, płaski `node_modules` bez ryzyka dla ścieżek w projektach natywnych. Przy jednym `package.json` w Nx przewaga ścisłości pnpm jest mała. | pnpm (szybszy, bezpieczniejsze domyślne ustawienia, ale ryzyko z symlinkami w Capacitorze i dodatkowa konfiguracja), yarn PnP, bun |
| Kontekst AI | Jedno źródło (`AGENTS.md` + `.claude/skills/`), adaptery generowane skryptem | Starter będzie używany z różnymi narzędziami AI; każde czyta inne pliki, a ręczne kopie się rozjeżdżają (sekcja 10). | Własny katalog `ai/` (żadne narzędzie go nie znajdzie), konfiguracja tylko pod jedno narzędzie |

**Ograniczenia Capacitora, które akceptujemy:** słabsza wydajność ciężkich animacji i bardzo długich list na słabszych Androidach, brak pracy w tle bez kodu natywnego, natywne odczucie wymaga świadomej pracy nad UI. Jeśli konkretna aplikacja okaże się mocno oparta na gestach i animacjach, abstrakcje platformy z sekcji 5 pozwalają przenieść logikę do NativeScripta i przepisać tylko widoki.

**Wymóg Apple:** aplikacja nie może być wyłącznie opakowaną stroną (wytyczna 4.2). Starter dostarcza więc nawigację mobilną, obsługę offline i zachowania natywne opisane w sekcji 6.

## 3. Stos technologiczny

Wersje sprawdzone 9 października 2026 w oficjalnych źródłach i potwierdzone instalacją w kroku 1 (`nx report`). NestJS 12 nadal nie jest wspierany przez `@nx/nest`, więc startujemy na 11 (ADR-0010).

| Element | Wersja docelowa | Co z niej wynika |
| --- | --- | --- |
| [Node.js](https://nodejs.org/en/about/previous-releases) | 24 LTS (24.21.0) | Spełnia wymagania Angulara 22 (`^24.15.0`), NestJS i Capacitora 8 (min. 22). Wersja 26 ma jeszcze status Current. |
| npm | 11.x lub nowszy | npm 10 przerywa instalację workspace błędem `edgesOut` (ADR-0007). Wymuszane przez `engines` i `engine-strict`. |
| [TypeScript](https://angular.dev/reference/versions) | 6.0.x (zainstalowane 6.0.3) | Angular 22 wymaga `>=6.0.0 <6.1.0`. Jedna wersja dla całego monorepo. TypeScript 7.0 jest już wydany, ale Angular go jeszcze nie wspiera. |
| [Angular](https://angular.dev/reference/versions) | 22.2.x (zainstalowane 22.2.2) | Nx 23.3 instaluje `~22.1.0`, ale ta linia ma podatności high i critical; 22.2.2 mieści się w zakresie `@nx/angular` (`<23`). Wyjątek opisany w ADR-0009. RxJS `~7.8.0`. |
| [Nx](https://github.com/nrwl/nx/releases) | 23.3.0 | Wersja `latest` w npm w dniu kroku 1. [Angular 22.1 wymaga Nx >= 23.2.0](https://nx.dev/docs/kb/angular-nx-version-matrix). |
| [NestJS](https://github.com/nestjs/nest/releases) | 11.2.x teraz, 12.x po wsparciu w Nx | Najnowsza wersja to 12.1.2. `@nx/nest` 23.3.0 deklaruje `>=10.0.0 <12.0.0` (ADR-0010). Patrz reguła niżej. |
| [Capacitor](https://capacitorjs.com/docs/main/reference/support-policy) | 8.x | Jedyna aktywnie rozwijana linia. Wymaga Xcode 26+, Android Studio 2025.2.1+; aplikacje działają od iOS 15 i Androida 7 (API 24). |
| [PostgreSQL](https://www.postgresql.org/support/versioning/) | 18 (18.6) | Wspierany do listopada 2030. Wersja 19 jest w becie. |
| [Prisma ORM](https://github.com/prisma/prisma/releases) | 7.x (najnowsza stabilna 7.10.0) | Propozycja, nie ustalenie (sekcja 12). Tag `latest` w npm wskazuje już 8.0.0-rc.22, więc wersję trzeba przypiąć jawnie. Wersja 8 wciąż łamie API i nie nadaje się do startera. |
| Testy | Vitest | Jeden runner dla frontendu i backendu. |
| Lint | ESLint z regułą granic modułów Nx | Pilnuje zależności między bibliotekami (sekcja 4). |

**Reguła dla NestJS.** W kroku 1 planu sprawdź tabelę wersji w dokumentacji `@nx/nest`. Jeśli obejmuje już `^12.0.0`, startuj od razu na 12. Jeśli nie, startuj na 11.2.x i pisz kod zgodny z 12 (walidacja schematami, Vitest), a migrację wykonaj później komendą `nest upgrade`, która przenosi wszystkie pakiety `@nestjs/*` naraz.

**Co NestJS 12 zmienia dla startera:** pakiety jako ESM, natywna walidacja przez Standard Schema (Zod) w `@Body()`, `@Query()` i `@Param()`, pole `errorCode` w wyjątkach HTTP, Vitest jako domyślny runner. Kontrakt z sekcji 8 jest zaprojektowany tak, by działał na obu wersjach.

**Zasada ogólna:** wersje Angulara i TypeScriptu wybiera Nx (generator instaluje najnowsze wspierane), a nie ręczne `npm install`. Aktualizacje wykonuje `nx migrate latest`.

## 4. Struktura monorepo

Dwie aplikacje, trzy grupy bibliotek i jedna reguła: frontend i backend nigdy nie importują się nawzajem, a spotykają się wyłącznie w `libs/shared`.

&#91;embedded content: architektura monorepo · 2 aplikacje, 3 grupy bibliotek, baza\]

Powłoka natywna i aplikacja web korzystają z bibliotek frontendu, API z bibliotek backendu, a obie strony ze wspólnego kontraktu.

```
apps/
  web/                      # Angular: web + źródło dla Capacitora
  api/                      # NestJS
libs/
  shared/
    contracts/              # schematy Zod, typy DTO, kody błędów, stałe API
  web/
    core/platform/          # tokeny i implementacje: storage, sieć, cykl życia
    core/http/              # interceptory, klient API, obsługa błędów
    core/auth/              # stan sesji, guardy, odświeżanie tokenów
    ui/                     # komponenty prezentacyjne, style, safe areas
    feature-auth/           # ekrany logowania i rejestracji (lazy)
    feature-home/           # przykładowy ekran po zalogowaniu (lazy)
  api/
    database/               # klient ORM, schemat, migracje
    auth/                   # moduł auth: tokeny, guardy, strategie
    users/                  # moduł użytkowników
    common/                 # filtry wyjątków, pipe walidacji, konfiguracja
capacitor.config.ts         # w katalogu głównym repozytorium
ios/  android/              # projekty natywne, commitowane
docker-compose.yml          # PostgreSQL do pracy lokalnej
docs/                       # PRD, architektura, ADR-y, kontekst produktu (sekcja 10)
tools/ai/                   # źródła i generator adapterów dla narzędzi AI
AGENTS.md  .claude/skills/  # kontekst dla narzędzi AI (sekcja 10)
```

**Tagi i granice** (wymuszane regułą `@nx/enforce-module-boundaries`, błąd lintu przy naruszeniu):

| Tag | Może importować |
| --- | --- |
| `scope:web` | `scope:web`, `scope:shared` |
| `scope:api` | `scope:api`, `scope:shared` |
| `scope:shared` | tylko `scope:shared` |
| `type:feature` | `type:ui`, `type:core`, `type:contracts` |
| `type:ui` | `type:ui`, `type:contracts` |
| `type:core` | `type:core`, `type:contracts` |
| `type:app` | wszystkie typy w swoim `scope` i `scope:shared` |
| `type:data-access` | `type:data-access`, `type:util`, `type:contracts` |
| `type:util` | `type:util`, `type:contracts` |
| `type:contracts` | tylko `type:contracts` |

Przypisanie typów: `apps/*` mają `type:app`; `libs/shared/contracts` ma `type:contracts`; `libs/web/core/*` mają `type:core`; `libs/web/ui` ma `type:ui`; `libs/web/feature-*`, `libs/api/auth` i `libs/api/users` mają `type:feature`; `libs/api/database` ma `type:data-access`; `libs/api/common` ma `type:util`. Na potrzeby backendu `type:feature` może importować także `type:data-access` i `type:util`.

**Dodatkowe zasady**

- `libs/shared/contracts` nie zależy od Angulara ani NestJS. Zawiera czysty TypeScript i Zod.
- Pluginy Capacitora wolno importować wyłącznie w `libs/web/core/platform`. Reguła lintu `no-restricted-imports` blokuje `@capacitor/*` wszędzie indziej.
- Capacitor leży w katalogu głównym, bo jego CLI wymaga `package.json` z zależnościami w miejscu uruchomienia. Druga aplikacja mobilna wymagałaby przeniesienia konfiguracji do katalogu aplikacji.
- Nazwy plików w kebab-case z sufiksami Angulara (`*.component.ts`, `*.service.ts`), testy jako `*.spec.ts`.

## 5. Wymagania: frontend (Angular)

Aplikacja jest zwykłą aplikacją Angular, która nie wie, czy działa w przeglądarce, czy w powłoce natywnej. Wszystko, co zależy od platformy, przechodzi przez abstrakcje.

### 5.1 Architektura

- **FE-1.** Wyłącznie komponenty standalone, bez `NgModule`.
- **FE-2.** Stan w sygnałach (`signal`, `computed`, `linkedSignal`, `resource`); RxJS tylko tam, gdzie strumień jest naturalny (HTTP, zdarzenia).
- **FE-3.** Detekcja zmian bez Zone.js i `ChangeDetectionStrategy.OnPush` w każdym komponencie.
- **FE-4.** Wstrzykiwanie przez `inject()`, bez wstrzykiwania w konstruktorze.
- **FE-5.** Każda biblioteka `feature-*` ładowana leniwie przez `loadChildren` lub `loadComponent`.
- **FE-6.** Nowa składnia szablonów (`@if`, `@for` z `track`, `@defer` dla treści poza pierwszym ekranem).
- **FE-7.** `strict: true` w TypeScripcie, zakaz `any` wymuszony lintem.
- **FE-8.** Obrazy przez `NgOptimizedImage`; brak `innerHTML` i bezpośredniej manipulacji DOM.

### 5.2 Abstrakcje platformy

**FE-9.** Każda funkcja zależna od platformy ma interfejs, `InjectionToken` i dwie implementacje. Wybór implementacji następuje raz, w `app.config.ts`.

| Abstrakcja | Web | Native | Do czego służy |
| --- | --- | --- | --- |
| `KEY_VALUE_STORAGE` | `localStorage` | `@capacitor/preferences` | Ustawienia niewrażliwe |
| `SECURE_STORAGE` | pamięć + ciasteczko `httpOnly` dla refresh tokenu | Keychain / Keystore przez plugin | Tokeny |
| `NETWORK_STATUS` | `navigator.onLine` + zdarzenia | `@capacitor/network` | Tryb offline |
| `APP_LIFECYCLE` | `visibilitychange` | `@capacitor/app` | Pauza, wznowienie, przycisk wstecz, deep linki |
| `PLATFORM_INFO` | stała `web` | `Capacitor.getPlatform()` | Warunkowy UI i nagłówki API |

```ts
// libs/web/core/platform/src/lib/storage/key-value-storage.ts
import { InjectionToken } from '@angular/core';

export interface KeyValueStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export const KEY_VALUE_STORAGE = new InjectionToken<KeyValueStorage>('KEY_VALUE_STORAGE');
```

```ts
// libs/web/core/platform/src/lib/provide-platform.ts
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { Capacitor } from '@capacitor/core';

export function providePlatform(): EnvironmentProviders {
  const isNative = Capacitor.isNativePlatform();

  return makeEnvironmentProviders([
    {
      provide: KEY_VALUE_STORAGE,
      useClass: isNative ? NativeKeyValueStorageService : WebKeyValueStorageService,
    },
    // pozostałe tokeny analogicznie
  ]);
}
```

- **FE-10.** Interfejsy są asynchroniczne (`Promise` lub sygnał), nawet gdy implementacja webowa jest synchroniczna.
- **FE-11.** Każda abstrakcja ma implementację testową w pamięci, używaną w testach jednostkowych.
- **FE-26.** Kod gotowy na SSR: `window`, `document`, `localStorage` i `navigator` są dostępne wyłącznie w `libs/web/core/platform` (reguła lintu `no-restricted-globals`), a kod zależny od DOM działa w `afterNextRender`. Dodanie SSR w konkretnej aplikacji nie wymaga wtedy audytu kodu.

### 5.3 HTTP i sesja

- **FE-12.** Bazowy adres API pochodzi z konfiguracji środowiska i jest absolutny. Ścieżki względne (`/api`) nie działają w WebView.
- **FE-13.** Interceptor funkcyjny dodaje `Authorization: Bearer`, `X-App-Version` i `X-App-Platform`.
- **FE-14.** Odpowiedź 401 uruchamia jedno odświeżenie tokenu; równoległe żądania czekają na jego wynik i są ponawiane raz.
- **FE-15.** Błędy API są mapowane na typ `ApiError` z `libs/shared/contracts`; komponenty reagują na `errorCode`, nie na treść komunikatu.
- **FE-16.** Brak sieci daje czytelny stan w UI (baner offline), a nie nieobsłużony wyjątek.

### 5.4 Layout i UX mobilny

- **FE-17.** `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- **FE-18.** Safe areas jako zmienne CSS oparte na `env(safe-area-inset-*)`, zdefiniowane raz w `libs/web/ui` i używane przez szkielet aplikacji.
- **FE-19.** Minimalny cel dotykowy 44 x 44 px; żadna funkcja nie zależy wyłącznie od `:hover`.
- **FE-20.** Breakpointy i odstępy jako tokeny SASS w jednym pliku; style pisane mobile-first.
- **FE-21.** Szkielet aplikacji ma dwa warianty nawigacji: dolny pasek na wąskich ekranach i boczny panel na szerokich.
- **FE-22.** Wyłączone: podświetlenie po tapnięciu, zaznaczanie tekstu w elementach interfejsu, efekt przeciągania całej strony (`overscroll-behavior: none`).
- **FE-23.** Pola formularzy mają czcionkę co najmniej 16 px, co zapobiega automatycznemu zoomowi na iOS.
- **FE-24.** Semantyczny HTML, etykiety dla wszystkich kontrolek, widoczny fokus, kontrast zgodny z WCAG 2.2 AA.

### 5.5 Formularze i walidacja

- **FE-25.** Formularze logowania i rejestracji walidują dane tymi samymi schematami Zod, których używa backend.

## 6. Wymagania: mobile (Capacitor)

Capacitor pakuje statyczny build Angulara w natywny projekt iOS i Android. Usunięcie katalogów `ios/`, `android/` i pliku `capacitor.config.ts` musi zostawić w pełni działającą aplikację webową.

### 6.1 Build

- **MOB-1.** Osobna konfiguracja builda `mobile` w projekcie `web`: bez SSR i prerenderingu, statyczny output z `index.html`, plik środowiska z produkcyjnym adresem API.
- **MOB-2.** `webDir` w `capacitor.config.ts` wskazuje katalog wyjściowy tej konfiguracji (dla buildera aplikacji Angulara jest to podkatalog `browser`).
- **MOB-3.** Routing oparty na ścieżkach (`PathLocationStrategy`); deep linki mapują się wprost na trasy.
- **MOB-4.** Budżet rozmiaru początkowego bundla ustawiony w konfiguracji builda; przekroczenie przerywa build.

```ts
// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.starter',
  appName: 'Starter',
  webDir: 'dist/apps/web/browser',
};

export default config;
```

### 6.2 Skrypty

| Skrypt | Działanie |
| --- | --- |
| `npm run build:mobile` | `nx build web --configuration=mobile` |
| `npm run cap:sync` | build mobilny, potem `npx cap sync` |
| `npm run cap:ios` | sync, potem `npx cap open ios` |
| `npm run cap:android` | sync, potem `npx cap open android` |
| `npm run cap:dev` | live reload na urządzeniu z serwera deweloperskiego |

### 6.3 Pluginy w starterze

Tylko to, czego wymagają abstrakcje z sekcji 5.2: `@capacitor/app`, `@capacitor/network`, `@capacitor/preferences`, `@capacitor/keyboard`, `@capacitor/status-bar`, `@capacitor/splash-screen` oraz jeden plugin bezpiecznego magazynu (sekcja 12). Wersje pluginów muszą mieć ten sam numer główny co `@capacitor/core`.

### 6.4 Zachowania natywne

- **MOB-5. Przycisk wstecz (Android).** Cofa w historii routera; na ekranie głównym minimalizuje aplikację.
- **MOB-6. Wznowienie aplikacji.** Po powrocie z tła sprawdzana jest ważność tokenu i stan sieci.
- **MOB-7. Deep linki.** Zdarzenie otwarcia adresu URL jest tłumaczone na nawigację routera. Konfiguracja Universal Links i App Links jest opisana w README, a nie włączona domyślnie.
- **MOB-8. Klawiatura.** Aktywne pole formularza pozostaje widoczne po wysunięciu klawiatury.
- **MOB-9. Pasek stanu i splash screen.** Kolory zgodne z motywem; splash znika po pierwszym renderze, nie po stałym czasie.
- **MOB-10. Offline.** Aplikacja uruchamia się bez sieci i pokazuje stan offline zamiast pustego ekranu.
- **MOB-11. Wymuszona aktualizacja.** Gdy API zwróci kod `APP_VERSION_UNSUPPORTED`, aplikacja pokazuje ekran z prośbą o aktualizację (sekcja 8).

### 6.5 Bezpieczeństwo

- **MOB-12.** Tokeny wyłącznie w Keychain (iOS) i Keystore (Android), nigdy w `localStorage` ani `@capacitor/preferences`.
- **MOB-13.** Ruch tylko po HTTPS; brak wyjątków dla nieszyfrowanego ruchu w buildach produkcyjnych.
- **MOB-14.** Nawigacja WebView ograniczona do własnej domeny; linki zewnętrzne otwierają się w przeglądarce systemowej.

### 6.6 Środowisko deweloperskie

iOS wymaga macOS z Xcode 26 lub nowszym, Android wymaga Android Studio 2025.2.1 lub nowszego. README startera zawiera listę kontrolną instalacji dla obu platform.

## 7. Wymagania: backend (NestJS + PostgreSQL)

API dostarcza wyłącznie to, co wspólne dla każdej aplikacji: użytkowników, uwierzytelnianie, konfigurację i obsługę błędów. Logika domenowa dochodzi jako kolejne moduły w `libs/api`.

### 7.1 Punkty końcowe

| Metoda | Ścieżka | Dostęp | Działanie |
| --- | --- | --- | --- |
| POST | `/v1/auth/register` | publiczny | Tworzy konto, zwraca parę tokenów |
| POST | `/v1/auth/login` | publiczny | Zwraca parę tokenów |
| POST | `/v1/auth/refresh` | refresh token | Rotuje refresh token, zwraca nową parę |
| POST | `/v1/auth/logout` | zalogowany | Unieważnia bieżący refresh token |
| GET | `/v1/users/me` | zalogowany | Profil bieżącego użytkownika |
| GET | `/v1/app/config` | publiczny | Minimalna wspierana wersja aplikacji na platformę |
| GET | `/health` | publiczny | Stan API i połączenia z bazą |

### 7.2 Uwierzytelnianie

- **BE-1.** Access token JWT ważny 15 minut, przesyłany w nagłówku `Authorization`.
- **BE-2.** Refresh token ważny 30 dni, nieprzezroczysty, zapisany w bazie wyłącznie jako skrót.
- **BE-3.** Każde odświeżenie rotuje refresh token. Ponowne użycie zrotowanego tokenu unieważnia całą rodzinę tokenów użytkownika.
- **BE-4.** Transport refresh tokenu zależy od platformy: aplikacja natywna przesyła go w treści żądania, web otrzymuje go w ciasteczku `httpOnly`, `Secure`, `SameSite=Strict` ograniczonym do ścieżki `/v1/auth`. To nie jest sesja na ciasteczkach z sekcji 2: access token zawsze idzie w nagłówku. Wymaga to `withCredentials` w żądaniach do `/v1/auth/*` po stronie klienta i `credentials: true` w CORS; aplikacja web i API muszą działać w tej samej witrynie (np. `app.example.com` i `api.example.com`), inaczej `SameSite=Strict` nie wyśle ciasteczka.
- **BE-5.** Hasła haszowane algorytmem Argon2id.
- **BE-6.** Globalny guard wymaga uwierzytelnienia domyślnie; trasy publiczne oznacza dekorator `@Public()`.
- **BE-7.** Limit żądań na trasach `/v1/auth/*`.

### 7.3 Baza danych

- **BE-8.** Schemat startowy: `User` (id UUID, email unikalny, hash hasła, znaczniki czasu) i `RefreshToken` (id, userId, skrót tokenu, identyfikator rodziny, platforma, data wygaśnięcia, data unieważnienia).
- **BE-9.** Każda zmiana schematu jest migracją w repozytorium. Zakaz synchronizacji schematu bez migracji poza pracą lokalną.
- **BE-10.** Dostęp do bazy tylko przez `libs/api/database`; moduły domenowe nie tworzą własnych połączeń.
- **BE-11.** `docker-compose.yml` uruchamia PostgreSQL 18 z trwałym wolumenem; skrypt `db:seed` tworzy konto testowe.

### 7.4 Konfiguracja i uruchomienie

- **BE-12.** Zmienne środowiskowe walidowane schematem Zod przy starcie; brakująca lub błędna zmienna zatrzymuje aplikację z czytelnym komunikatem.
- **BE-13.** Plik `.env.example` zawiera wszystkie zmienne; `.env` jest w `.gitignore`.
- **BE-14.** CORS z jawną listą originów ze zmiennej środowiskowej. Lista domyślna: adres aplikacji web, `capacitor://localhost`, `https://localhost`.
- **BE-15.** Dokumentacja OpenAPI generowana z kodu i dostępna pod `/docs` poza produkcją.
- **BE-16.** Logi strukturalne w formacie JSON na produkcji, z identyfikatorem żądania.
- **BE-17.** Nagłówki bezpieczeństwa przez `helmet`; poprawne zamykanie połączeń przy sygnale zakończenia procesu.

## 8. Kontrakt frontend–backend

Jedno źródło prawdy: schemat Zod w `libs/shared/contracts`. Z niego powstaje typ TypeScript, walidacja w API i walidacja formularza.

```ts
// libs/shared/contracts/src/lib/auth/login.contract.ts
import { z } from 'zod';

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const tokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresIn: z.number().int().positive(),
});

export type TokenPair = z.infer<typeof tokenPairSchema>;
```

- **CON-1.** Każdy punkt końcowy ma w `contracts` schemat żądania i odpowiedzi. Kontroler i klient API importują te same typy.
- **CON-2.** Backend waliduje dane wejściowe schematem. Na NestJS 12 natywnie (`@Body({ schema })` z `StandardSchemaValidationPipe`), na NestJS 11 przez własny pipe w `libs/api/common` o tym samym zachowaniu.
- **CON-3.** Ścieżki punktów końcowych są stałymi w `contracts`, używanymi po obu stronach.

### 8.1 Format błędu

Każdy błąd API ma ten sam kształt, zapewniany przez globalny filtr wyjątków:

```ts
export interface ApiError {
  statusCode: number;
  errorCode: ErrorCode;
  message: string;
  details?: Record<string, string[]>;
}
```

| `errorCode` | Status | Znaczenie |
| --- | --- | --- |
| `VALIDATION_FAILED` | 400 | Błędy pól w `details` |
| `INVALID_CREDENTIALS` | 401 | Błędny email lub hasło |
| `TOKEN_EXPIRED` | 401 | Access token wygasł, klient odświeża |
| `REFRESH_TOKEN_INVALID` | 401 | Wymagane ponowne logowanie |
| `EMAIL_TAKEN` | 409 | Konto już istnieje |
| `APP_VERSION_UNSUPPORTED` | 426 | Wymagana aktualizacja aplikacji |
| `RATE_LIMITED` | 429 | Zbyt wiele żądań |
| `INTERNAL_ERROR` | 500 | Błąd nieobsłużony, bez szczegółów w odpowiedzi |

### 8.2 Wersjonowanie

- **CON-4.** Wersja w ścieżce (`/v1`). Zmiana łamiąca kontrakt oznacza nowy prefiks, a stary działa równolegle przez ustalony okres.
- **CON-5.** W obrębie wersji dozwolone są tylko zmiany addytywne: nowe pola opcjonalne i nowe punkty końcowe.
- **CON-6.** Klient wysyła `X-App-Version` i `X-App-Platform`. Guard porównuje wersję z minimalną wspieraną i w razie potrzeby zwraca `APP_VERSION_UNSUPPORTED`.
- **CON-7.** Klient ignoruje nieznane pola w odpowiedziach, więc starsze wersje aplikacji przeżywają rozszerzenia API.

## 9. Jakość

Starter jest wzorcem dla kolejnych projektów, więc każdy element kodu startowego ma test i przechodzi lint bez wyjątków.

### 9.1 Testy

| Poziom | Narzędzie | Zakres w starterze |
| --- | --- | --- |
| Jednostkowe (web) | Vitest | Implementacje abstrakcji platformy, interceptory, logika odświeżania tokenu, guardy |
| Jednostkowe (api) | Vitest | Serwis auth (rotacja, wykrycie ponownego użycia), guardy, filtr wyjątków, pipe walidacji |
| Integracyjne (api) | Vitest + prawdziwy PostgreSQL w kontenerze | Pełne przepływy auth na punktach końcowych |
| Kontraktowe | Vitest | Schematy w `contracts`: poprawne i błędne dane |
| E2E (web) | Playwright | Rejestracja, logowanie, odświeżenie sesji, wylogowanie; widok mobilny i desktopowy |

- **QA-1.** Testy w układzie Arrange-Act-Assert.
- **QA-2.** Próg pokrycia 80% linii dla `libs/web/core/*`, `libs/api/*` i `libs/shared/*`; spadek poniżej progu przerywa CI.
- **QA-3.** Aplikacja natywna jest testowana ręcznie według listy kontrolnej w README (sekcja 11, krok 9). Automatyzacja testów na urządzeniach jest poza zakresem.

### 9.2 Statyczna analiza

- **QA-4.** ESLint z regułą granic modułów, zakazem `any` i blokadą importów `@capacitor/*` poza warstwą platformy.
- **QA-5.** Prettier: pojedyncze cudzysłowy, wcięcie 2 spacje.
- **QA-6.** Wymuszona kolejność importów: Angular, RxJS, moduły Angulara, core, shared, środowisko, ścieżki względne.
- **QA-7.** Hook przed commitem uruchamia lint i formatowanie na zmienionych plikach.

### 9.3 CI

Jeden pipeline na każdy pull request, oparty na `nx affected`, więc wykonuje się tylko to, czego dotyczy zmiana:

1. Instalacja z cache.
2. `nx affected -t lint test build` oraz `npm run ai:check` (zgodność adapterów AI ze źródłami, sekcja 10).
3. Testy integracyjne API z usługą PostgreSQL.
4. Testy E2E web.
5. Build konfiguracji `mobile` i `npx cap sync` jako test dymny (bez kompilacji natywnej).

Kompilacja natywna i publikacja w sklepach są poza zakresem. README opisuje, jak je dodać.

### 9.4 Wydajność

- **QA-8.** Budżet początkowego bundla JavaScript: ostrzeżenie od 300 kB, błąd od 500 kB (rozmiar przed kompresją).
- **QA-9.** Cele Core Web Vitals dla wersji web na profilu mobilnym: LCP poniżej 2,5 s, INP poniżej 200 ms, CLS poniżej 0,1.
- **QA-10.** Listy dłuższe niż 50 elementów korzystają z wirtualizacji.

### 9.5 Bezpieczeństwo

- **QA-11.** Brak sekretów w repozytorium i w bundlu frontendu; skan sekretów w CI.
- **QA-12.** `npm audit` w CI; podatności o poziomie wysokim i krytycznym przerywają pipeline.
- **QA-13.** Content Security Policy dla wersji web; brak `innerHTML` i `bypassSecurityTrust*` w kodzie startera.

## 10. Kontekst dla narzędzi AI

Starter jest bazą do budowania aplikacji z pomocą agentów AI, a zespół może używać różnych narzędzi. Każde z nich szuka kontekstu w innych plikach, więc starter utrzymuje jedno źródło prawdy i generuje z niego pliki dla poszczególnych narzędzi.

### 10.1 Co czyta każde narzędzie

Stan sprawdzony 9 października 2026 w dokumentacji [Claude Code](https://code.claude.com/docs/en/memory), [Cursor](https://cursor.com/docs/rules), [VS Code](https://code.visualstudio.com/docs/agent-customization/custom-instructions) i [GitHub](https://docs.github.com/en/copilot/reference/custom-instructions-support).

| | Claude Code | Cursor | Copilot (VS Code) |
| --- | --- | --- | --- |
| `AGENTS.md` w katalogu głównym | tak, ale tylko gdy nie ma `CLAUDE.md` | tak | tak |
| `AGENTS.md` w podkatalogach | tak, przy pracy w katalogu (ta sama zasada) | tak | eksperymentalnie, domyślnie wyłączone |
| Skille w `.claude/skills/` | tak (jedyne miejsce) | tak (zgodność) | tak |
| Skille w `.agents/skills/` | nie | tak | tak |
| Reguły dla ścieżek | `.claude/rules/` | `.cursor/rules/*.mdc` | `.github/instructions/*.instructions.md` |
| Konfiguracja MCP | `.mcp.json` | `.cursor/mcp.json` | `.vscode/mcp.json` |

Czat Copilota w JetBrains i przegląd kodu Copilota w VS Code nie czytają `AGENTS.md`, tylko `.github/copilot-instructions.md`.

### 10.2 Struktura

```
# ŹRÓDŁA (edytowane ręcznie)
AGENTS.md                              # zasady ogólne, komendy, mapa repo; sekcja <!-- core-rules -->
apps/api/AGENTS.md                     # zasady lokalne obszaru
libs/web/core/platform/AGENTS.md
libs/shared/contracts/AGENTS.md
.claude/skills/<nazwa>/SKILL.md        # skille, czytane przez Claude Code, Cursor i Copilot
tools/ai/mcp-servers.json              # lista serwerów MCP (Nx, Angular CLI)
tools/ai/sync.mts                       # generator adapterów
docs/prd/starter.md                    # ten dokument
docs/architecture.md                   # mapa monorepo, przepływ auth, abstrakcje platformy
docs/decisions/NNNN-<temat>.md         # ADR-y
docs/product/                          # pusty w starterze; domena i słownik konkretnej aplikacji

# GENEROWANE (commitowane, z nagłówkiem „nie edytuj, źródło: …”)
CLAUDE.md, apps/api/CLAUDE.md, …       # jedna linia: @AGENTS.md
.github/copilot-instructions.md        # sekcja core-rules z głównego AGENTS.md
.github/instructions/*.instructions.md # lokalne AGENTS.md z applyTo: <ścieżka>/**
.mcp.json  .cursor/mcp.json  .vscode/mcp.json
```

### 10.3 Wymagania

- **AI-1.** Jedynymi ręcznie edytowanymi plikami instrukcji są pliki `AGENTS.md`. Wszystkie pliki specyficzne dla narzędzi powstają z nich komendą `npm run ai:sync`.
- **AI-2.** Obok każdego `AGENTS.md` leży wygenerowany `CLAUDE.md` z importem `@AGENTS.md` (główny `CLAUDE.md` zawiera dodatkowo blok Nx, którego wymaga `nx configure-ai-agents`). Bez niego Claude Code przestaje czytać `AGENTS.md`, gdy w ścieżce pojawi się jakikolwiek `CLAUDE.md`, a import nie podwaja treści i działa na starszych wersjach.
- **AI-3.** `.github/copilot-instructions.md` zawiera tylko sekcję `core-rules` z głównego `AGENTS.md`, bo czat Copilota sumuje oba pliki. Lokalne `AGENTS.md` trafiają do Copilota jako `.github/instructions/*.instructions.md` z `applyTo`, a nie przez jego eksperymentalne ustawienie.
- **AI-4.** Skille leżą w `.claude/skills/`, jedynym katalogu czytanym przez wszystkie trzy narzędzia. Frontmatter zawiera tylko `name` i `description` z otwartego formatu Agent Skills; treść nie odwołuje się do narzędzi konkretnego agenta, a komendy są zwykłymi komendami `npx nx …` i `npm run …`.
- **AI-5.** Główny `AGENTS.md` jest krótki (cel: poniżej 150 linii): cel repozytorium, mapa katalogów, komendy weryfikacji, zasady niewymuszone konfiguracją i odnośniki do `docs/`. Nie powtarza reguł, które wymusza lint lub TypeScript.
- **AI-6.** Twarde reguły wymusza lint, hook przed commitem (QA-7) i CI, niezależne od narzędzia. Hooki i subagenci konkretnych narzędzi są opcjonalni i nie stanowią jedynej gwarancji; przegląd architektury jest skillem, nie subagentem.
- **AI-7.** Każda decyzja z sekcji 2 i 12 ma ADR w `docs/decisions/` z kontekstem, decyzją, odrzuconymi opcjami i warunkiem powrotu do tematu, żeby agent nie „naprawiał” świadomych decyzji.
- **AI-8.** `npm run ai:check` w CI przerywa pipeline, gdy wygenerowane pliki różnią się od wyniku `ai:sync`.
- **AI-9.** Serwery MCP Nx i Angular CLI są skonfigurowane dla wszystkich trzech narzędzi. Claude Code dostaje serwer Nx z pluginu Nx (`nx configure-ai-agents`), pozostałe wpisy generuje `sync.mts` z `tools/ai/mcp-servers.json`.
- **AI-10.** Kontekst startera i kontekst aplikacji są rozdzielone: aplikacja budowana na starterze dopisuje domenę w `docs/product/` i własne skille z innym prefiksem, nie edytując skilli startera.

### 10.4 Skille startera

Każdy skill powstaje po kroku planu, który tworzy opisywany wzorzec, i opisuje prawdziwy kod, a nie zamierzenie.

| Skill | Co prowadzi | Powstaje w kroku |
| --- | --- | --- |
| `add-endpoint` | Schemat w `contracts` → kontroler z walidacją → klient API → kody błędów → testy | 5 |
| `add-api-module` | Nowy moduł domenowy w `libs/api` z tagami, guardem i testem integracyjnym | 5 |
| `db-migration` | Zmiana schematu Prisma, migracja, aktualizacja seeda | 5 |
| `add-web-feature` | Nowa lazy biblioteka `feature-*` z trasą, tagami i testem | 7 |
| `add-platform-capability` | Nowy plugin Capacitora za abstrakcją: interfejs, token, implementacje web, native i testowa | 8 |
| `architecture-review` | Przegląd zmiany pod kątem granic modułów, kontraktu i wymagań FE, BE, MOB i CON | 9 |

## 11. Plan budowy

Dziewięć kroków, każdy kończy się działającym stanem i commitem. Flagi generatorów zmieniają się między wersjami Nx, więc przed użyciem sprawdź `--help` danego generatora. Każdy krok, który tworzy nową grupę bibliotek, dodaje jej lokalny `AGENTS.md` i uruchamia `npm run ai:sync`.

### Krok 1. Workspace i weryfikacja wersji

```bash
node -v                      # oczekiwane 24.x, npm 11+
# repozytorium git już istnieje, więc workspace powstaje obok i jest przenoszony do katalogu głównego
npx create-nx-workspace@latest starter --preset=angular-monorepo --appName=web --style=scss \
  --bundler=esbuild --ssr=false --zoneless --e2eTestRunner=playwright --packageManager=npm \
  --aiAgents claude cursor copilot --nxCloud=skip --skipGit
npx nx g @nx/angular:app apps/web --unitTestRunner=vitest-angular --tags=scope:web,type:app  # patrz uwagi
npx nx report                # wersje zapisane w README
```

Uwagi z wykonania kroku 1:

- Uruchomiony przez agenta AI (zmienne `CLAUDECODE` i podobne) `create-nx-workspace` podmienia preset na szablon demonstracyjny `nrwl/angular-template`. Agent musi uruchomić go bez tych zmiennych (ADR-0008).
- Preset przyjmuje `--unitTestRunner=vitest`, ale generator aplikacji Angular w Nx 23.3 oczekuje `vitest-angular` lub `vitest-analog` i bez tego tworzy aplikację bez testów. Aplikację `web` wygenerowano ponownie z `vitest-angular` (builder `@angular/build:unit-test`).
- Angular podniesiony do 22.2.2, a `undici` wymuszony w `overrides` ze względu na podatności (ADR-0009).

Wygenerowany workspace przenieś do katalogu repozytorium, zachowując istniejący `.git`. Dodaj `.nvmrc` z Node 24 i pole `engines` w `package.json`. Następnie sprawdź tabelę wersji `@nx/nest` i wybierz NestJS 11 lub 12 zgodnie z regułą z sekcji 3.

Kontekst AI: przenieś ten dokument do `docs/prd/starter.md`, utwórz szkielet `AGENTS.md`, ADR-y dla decyzji z sekcji 2 (`docs/decisions/`), `tools/ai/sync.mts` oraz skrypty `ai:sync` i `ai:check`. Konfiguracja Nx dla agentów (`--aiAgents`) zostaje i jest zarządzana przez Nx; `ai:check` sprawdza ją komendą `nx configure-ai-agents --check` (ADR-0008).

**Gotowe, gdy:** `nx serve web` pokazuje aplikację, `nx report` zwraca Angular 22.x i TypeScript 6.0.x, a `npm run ai:check` przechodzi.

### Krok 2. Backend i baza

```bash
nx add @nx/nest
nx g @nx/nest:app apps/api --frontendProject web
docker compose up -d         # PostgreSQL 18
```

**Gotowe, gdy:** `nx serve api` odpowiada na `GET /health`, a `nx build api` przechodzi na TypeScripcie 6.0. Jeśli build nie przechodzi, zatrzymaj się tutaj i rozwiąż zgodność wersji (ryzyko R1).

### Krok 3. Biblioteki i granice

```bash
nx g @nx/js:lib libs/shared/contracts
nx g @nx/angular:lib libs/web/core/platform
nx g @nx/angular:lib libs/web/core/http
nx g @nx/angular:lib libs/web/core/auth
nx g @nx/angular:lib libs/web/ui
nx g @nx/nest:lib libs/api/database
nx g @nx/nest:lib libs/api/common
nx g @nx/nest:lib libs/api/auth
nx g @nx/nest:lib libs/api/users
```

Dodaj tagi do każdego projektu i reguły granic z sekcji 4, regułę `no-restricted-imports` dla `@capacitor/*` i `no-restricted-globals` z FE-26. Dodaj lokalne `AGENTS.md` w `libs/shared/contracts` i `libs/web/core/platform`.

**Gotowe, gdy:** celowy import z `libs/api` w `libs/web` kończy `nx lint` błędem, a `nx graph` pokazuje strukturę z sekcji 4.

### Krok 4. Kontrakt

Schematy i typy auth, format błędu, kody błędów i stałe ścieżek w `libs/shared/contracts`.

**Gotowe, gdy:** testy schematów przechodzą, a biblioteka buduje się bez zależności od Angulara i NestJS.

### Krok 5. API: baza, auth, błędy

Schemat i pierwsza migracja, moduły `users` i `auth`, globalny guard, filtr wyjątków, walidacja konfiguracji, CORS, wersjonowanie `/v1`, OpenAPI. Lokalny `AGENTS.md` w `apps/api` i skille `add-endpoint`, `add-api-module`, `db-migration`.

**Gotowe, gdy:** testy integracyjne przechodzą dla rejestracji, logowania, odświeżenia, ponownego użycia zrotowanego tokenu i wylogowania.

### Krok 6. Web: platforma, HTTP, sesja

Abstrakcje platformy z implementacjami webowymi i testowymi, interceptory, stan sesji w sygnałach, guardy tras.

**Gotowe, gdy:** testy jednostkowe przechodzą, w tym scenariusz równoległych żądań przy wygasłym tokenie.

### Krok 7. Web: UI i ekrany

Szkielet aplikacji z dwoma wariantami nawigacji, tokeny SASS, safe areas, biblioteki `feature-auth` i `feature-home`, baner offline. Skill `add-web-feature`.

```bash
nx g @nx/angular:lib libs/web/feature-auth
nx g @nx/angular:lib libs/web/feature-home
```

**Gotowe, gdy:** testy E2E przechodzą w widoku mobilnym i desktopowym.

### Krok 8. Capacitor

```bash
npm i @capacitor/core
npm i -D @capacitor/cli
npx cap init
npm i @capacitor/android @capacitor/ios
npm i @capacitor/app @capacitor/network @capacitor/preferences \
      @capacitor/keyboard @capacitor/status-bar @capacitor/splash-screen
nx build web --configuration=mobile
npx cap add android
npx cap add ios
npx cap sync
```

Dodaj konfigurację builda `mobile`, implementacje natywne abstrakcji, obsługę przycisku wstecz, wznowienia i deep linków oraz skrypty z sekcji 6.2. Skill `add-platform-capability`.

**Gotowe, gdy:** aplikacja uruchamia się w symulatorze iOS i emulatorze Androida, a logowanie przetrwa zamknięcie i ponowne otwarcie aplikacji.

### Krok 9. CI, dokumentacja, lista kontrolna

Pipeline z sekcji 9.3, README (wymagania środowiska, komendy, dodawanie pluginu, dodawanie modułu API, praca z Claude Code, Cursorem i Copilotem), `docs/architecture.md`, skill `architecture-review` i ręczna lista kontrolna dla urządzeń:

- [ ] Logowanie i odświeżenie sesji po 15 minutach
- [ ] Sesja zachowana po restarcie aplikacji
- [ ] Przycisk wstecz na Androidzie
- [ ] Tryb samolotowy: baner offline, brak awarii
- [ ] Klawiatura nie zasłania aktywnego pola
- [ ] Treść nie wchodzi pod wycięcie ekranu i pasek systemowy
- [ ] Powrót z tła po godzinie

**Gotowe, gdy:** świeży klon repozytorium spełnia kryterium sukcesu z sekcji 1 (w tym test w każdym z trzech narzędzi AI: widzi instrukcje główne i lokalne oraz listę skilli), a pipeline jest zielony.

## 12. Otwarte decyzje i ryzyka

Trzy kwestie nie padły w dotychczasowych ustaleniach. Dokument przyjmuje dla nich wartości domyślne, które można zmienić przed krokiem wskazanym w tabeli.

### Otwarte decyzje

| Decyzja | Przyjęte domyślnie | Alternatywa | Rozstrzygnąć przed |
| --- | --- | --- | --- |
| ORM | Prisma 7.9.x: dojrzałe migracje, typy generowane ze schematu | Drizzle (bliżej SQL, lżejszy) lub TypeORM (klasy i dekoratory w stylu NestJS) | Krok 5 |
| Biblioteka UI | Własne minimalne komponenty w `libs/web/ui` | Ionic (gotowe natywne odczucie) lub Angular Material | Krok 7 |
| Plugin bezpiecznego magazynu | Wybór w kroku 8 spośród pluginów zgodnych z Capacitorem 8 | Własny plugin natywny | Krok 8 |

### Ryzyka

| Nr | Ryzyko | Skutek | Postępowanie |
| --- | --- | --- | --- |
| R1 | Jedna wersja TypeScriptu (6.0) dla Angulara 22 i NestJS; zgodność NestJS 11 z TypeScriptem 6.0 nie jest potwierdzona w źródłach | Build API nie przechodzi | Test dymny w kroku 2. W razie błędu przejść na NestJS 12 skonfigurowany ręcznie jako projekt Nx bez generatorów `@nx/nest` |
| R2 | `@nx/nest` nie wspiera jeszcze NestJS 12 | Start na przedostatniej wersji głównej | Reguła z sekcji 3; migracja komendą `nest upgrade` po aktualizacji pluginu |
| R3 | Nx 23.3 instaluje Angulara 22.1, który ma podatności; starter używa 22.2 spoza domyślnej wersji Nx | Generator lub migracja Nx może zakładać 22.1 | ADR-0009; przy każdym `nx migrate latest` sprawdzić, czy wyjątek i `overrides` są jeszcze potrzebne |
| R4 | Capacitor 9 jest w przygotowaniu | Migracja wersji głównej w ciągu życia startera | Pluginy tylko za abstrakcjami, więc zmiana dotyczy jednej biblioteki |
| R5 | Prisma 8 zmienia API | Migracja ORM w przyszłości | Dostęp do bazy tylko przez `libs/api/database` |
| R6 | Odrzucenie przez Apple z powodu wytycznej 4.2 | Opóźnienie publikacji konkretnej aplikacji | Wymagania MOB-5 do MOB-11 i co najmniej jedna funkcja natywna w każdej aplikacji budowanej na starterze |
| R7 | Wydajność WebView na słabszych Androidach | Wolne listy i animacje | Budżet bundla, wirtualizacja list, test na urządzeniu ze średniej półki w liście kontrolnej |
| R8 | Narzędzia AI szybko zmieniają pliki, które czytają (tabela w sekcji 10.1) | Któreś narzędzie przestaje widzieć instrukcje lub skille | Jedno źródło i generator: zmiana dotyczy tylko `tools/ai/sync.mts`; test w trzech narzędziach w liście kontrolnej kroku 9 |

### Kiedy wrócić do decyzji o Capacitorze

Jeśli aplikacja budowana na starterze wymaga złożonych animacji sterowanych gestami, długiej pracy w tle albo natywne odczucie jest jej główną cechą, rozważ NativeScript dla warstwy widoku. Biblioteki `shared/contracts`, `core/http` i `core/auth` oraz cały backend pozostają bez zmian.
