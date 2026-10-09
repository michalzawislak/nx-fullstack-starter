# ADR-0016: Bezpieczny magazyn i natywna warstwa platformy

- Status: przyjęta
- Data: 2026-10-09

## Kontekst

Krok 8 dodaje Capacitora 8. Refresh token w aplikacjach natywnych musi trafić do Keychain (iOS) i Keystore (Android), nigdy do `localStorage` ani `@capacitor/preferences` (MOB-12). Capacitor nie ma oficjalnego pluginu bezpiecznego magazynu, więc wybór był otwartą decyzją PRD (sekcja 12). Do tego dochodzą zachowania natywne z sekcji 6.4 i sposób uruchamiania aplikacji na symulatorach przeciw lokalnemu API.

## Decyzja

**Plugin: `@aparajita/capacitor-secure-storage` 8.0.1** (MIT, wersja główna zgodna z Capacitorem 8, Swift Package Manager na iOS).

- iOS: Keychain aplikacji z dostępem `whenUnlockedThisDeviceOnly` (wpis nie trafia do kopii na inne urządzenie). Synchronizacja z iCloud wyłączona (`setSynchronize(false)`).
- Android: dane szyfrowane AES-GCM kluczem z Android Keystore.
- Klucze z prefiksem `starter.`.
- **Reinstalacja na iOS.** Wpisy w Keychain przeżywają odinstalowanie aplikacji, więc po ponownej instalacji wróciłaby stara sesja. `NativeSecureStorage` przy pierwszym użyciu sprawdza znacznik w Preferences (system usuwa go razem z aplikacją). Brak znacznika oznacza świeżą instalację: magazyn jest czyszczony, a znacznik zapisywany.
- **Kopia zapasowa na Androidzie.** `android:allowBackup="false"`. Odtworzone dane byłyby zaszyfrowane kluczem Keystore, którego na nowym urządzeniu nie ma. Nieczytelny wpis i tak jest traktowany jak brak wpisu i usuwany.

**Warstwa platformy.** Natywne implementacje wszystkich tokenów z `libs/web/core/platform` (Preferences, Network, App). Do tego nowy token `SYSTEM_UI` (splash screen, pasek stanu, klawiatura) i `provideNativeShell()` (sekcja 6.4):

- Przycisk wstecz na Androidzie cofa w historii. Na ekranach głównych (`/`, `/login`, konfigurowalne) albo bez historii minimalizuje aplikację (MOB-5).
- Deep link zamieniany jest na ścieżkę i nawigację routera. Link `https://host/a?b` i własny schemat `scheme://a?b` dają tę samą ścieżkę `/a?b` (MOB-7).
- Po otwarciu klawiatury aktywne pole jest przewijane na środek. WebView na iOS zmniejsza się (`resize: native`), na Androidzie działa `resizeOnFullScreen` (MOB-8).
- Pasek stanu dostaje styl `Default`, który podąża za motywem systemu, tak jak tokeny UI. Splash znika po pierwszym renderze (`afterNextRender`), nie po stałym czasie (MOB-9).

`providePlatform()` wybiera implementacje raz, przez `Capacitor.isNativePlatform()`.

**Buildy i tryb deweloperski.**

- Konfiguracja `mobile` jest produkcyjna, a `mobile-dev` deweloperska. Obie zapisują do `dist/apps/web-mobile`.
- Zmienną `CAPACITOR_DEV=1` ustawiają tylko targety Nx `web:cap-sync:dev` i `web:cap-run:*` (działa na każdym systemie). Tylko wtedy `capacitor.config.ts` włącza `cleartext`, `allowMixedContent` i debugowanie WebView. Synchronizacja release je wyłącza (MOB-13).
- Emulator Androida widzi komputer pod adresem `10.0.2.2`, więc `environment.ts` ma `apiBaseUrlOverrides.android`.

## Odrzucone opcje

- **Inne pluginy społeczności**: brak prefiksów kluczy, brak kontroli nad synchronizacją iCloud i dostępem do Keychain albo dystrybucja w płatnym programie sponsorskim.
- **Własny plugin natywny**: kod Swift i Kotlin w starterze bez potrzeby.
- **`server.cleartext` na stałe w konfiguracji**: łamie MOB-13 w buildach sklepowych.
- **Adres `10.0.2.2` zamiast `localhost` przez `adb reverse`**: wymagałby ręcznej komendy przed każdym uruchomieniem bez live reload.

## Konsekwencje

- Bundle początkowy rośnie o około 14 kB (Capacitor core i proxy pluginów; webowe implementacje pluginów ładują się leniwie).
- Po synchronizacji deweloperskiej projekt Androida zezwala na HTTP do czasu następnej synchronizacji release. Build do sklepu zawsze poprzedza `npm run cap:sync` (README).
- Testy pluginów używają `vi.mock`. Biblioteka platformy używa puli `threads` Vitesta, bo domyślna pula `vmThreads` z AnalogJS współdzieli moduły między plikami i gubi mocki.
- iOS nie pozwala aplikacji się minimalizować, więc `minimize()` działa tylko na Androidzie.

## Kiedy wrócić do decyzji

Gdy Capacitor dostanie oficjalny plugin bezpiecznego magazynu, gdy plugin przestanie nadążać za wersją główną Capacitora (ryzyko R4) albo gdy aplikacja będzie potrzebowała dostępu do sekretów w tle (wtedy `afterFirstUnlockThisDeviceOnly`).
