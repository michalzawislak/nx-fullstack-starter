# ADR-0004: Uwierzytelnianie tokenami z odświeżaniem

- Status: przyjęta
- Data: 2026-10-09

## Kontekst

Origin aplikacji w WebView to `capacitor://localhost` (iOS) lub `https://localhost` (Android), więc sesje na ciasteczkach zawodzą na mobile.

## Decyzja

Access token JWT (15 min) zawsze w nagłówku `Authorization`. Refresh token (30 dni, rotowany, w bazie jako skrót): na mobile w treści żądania i w Keychain/Keystore, na webie w ciasteczku `httpOnly`, `Secure`, `SameSite=Strict` ograniczonym do `/v1/auth` (PRD, BE-1 do BE-4).

## Odrzucone opcje

- **Sesje na ciasteczkach** – nie działają w WebView.
- **Refresh token w `localStorage` na webie** – dostępny dla skryptów (XSS).

## Konsekwencje

Klient web wysyła żądania do `/v1/auth/*` z `withCredentials`, CORS ma `credentials: true`. Web i API muszą działać w tej samej witrynie (np. `app.example.com` i `api.example.com`).

## Kiedy wrócić do decyzji

Gdy web i API nie mogą działać w tej samej witrynie albo dochodzi logowanie społecznościowe.
