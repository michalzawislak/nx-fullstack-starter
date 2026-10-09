# ADR-0014: Własne minimalne komponenty UI

- Status: przyjęta
- Data: 2026-10-09

## Kontekst

Otwarta decyzja z PRD (sekcja 12) przed krokiem 7. Starter nie zna jeszcze konkretnej aplikacji, a biblioteka UI wpływa na wygląd, rozmiar bundla i natywne odczucie.

## Decyzja

Własne, minimalne komponenty w `libs/web/ui`: tokeny SASS i zmienne CSS w jednym pliku (`styles/_tokens.scss`), safe areas jako zmienne CSS, style bazowe (FE-18 do FE-24), `button[appButton]`, `app-text-field` z dyrektywą `appFieldControl` dla Signal Forms, `app-offline-banner` i `app-shell` z dolnym paskiem na wąskich ekranach i panelem bocznym od 768 px (FE-21). Formularze używają Signal Forms z Angulara 22 i `validateStandardSchema` ze schematami z kontraktu (FE-25).

## Odrzucone opcje

- **Ionic** – gotowe natywne odczucie, ale duży bundle i własny model nawigacji narzucony każdej aplikacji budowanej na starterze.
- **Angular Material** – dojrzała dostępność, ale webowy wygląd i dodatkowy rozmiar bez korzyści dla mobile.

## Konsekwencje

- Biblioteka UI dodaje około 10 kB do bundla początkowego; formularze (`@angular/forms`, 73 kB) trafiają tylko do leniwego chunka ekranów logowania.
- Konkretna aplikacja może dodać Ionic lub Material później, bez walki ze stylami startera: komponenty startera są małe i oparte na zmiennych CSS.
- Natywne odczucie (przejścia, gesty) trzeba dopracować w konkretnej aplikacji.

## Kiedy wrócić do decyzji

Gdy aplikacja potrzebuje wielu złożonych komponentów (tabele, daty, okna dialogowe) albo natywne odczucie jest jej główną cechą.
