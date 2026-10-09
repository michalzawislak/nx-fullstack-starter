# ADR-0006: Bez SSR, kod gotowy na SSR

- Status: przyjęta
- Data: 2026-10-09

## Kontekst

SSR daje SEO, podglądy linków i szybszy pierwszy ekran, ale głównie na publicznych stronach. Starter to aplikacja za logowaniem, a mobile i tak wymaga statycznego buildu (MOB-1).

## Decyzja

Aplikacja web bez SSR. Kod pozostaje bezpieczny dla serwera: `window`, `document`, `localStorage` i `navigator` tylko w `libs/web/core/platform` (reguła lintu), kod zależny od DOM w `afterNextRender` (FE-26).

## Odrzucone opcje

- **SSR od początku** – serwer nie zna sesji (access token w pamięci przeglądarki, ciasteczko tylko dla `/v1/auth`), więc renderuje widok anonimowy. Kosztuje drugą ścieżkę builda, trzecią implementację abstrakcji platformy i serwer Node zamiast CDN.

## Konsekwencje

Hosting webu jako pliki statyczne. SSR można dodać w konkretnej aplikacji generatorem `npx nx g @nx/angular:setup-ssr` bez audytu kodu.

## Kiedy wrócić do decyzji

Gdy aplikacja ma istotną publiczną część pod SEO. Najpierw rozważ osobną aplikację lub statyczny generator dla tej części.
