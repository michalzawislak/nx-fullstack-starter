# ADR-0001: Monorepo Nx

- Status: przyjęta
- Data: 2026-10-09

## Kontekst

Frontend (web i mobile) oraz backend dzielą kontrakt API i walidację. Przy osobnych repozytoriach zmiana kontraktu po jednej stronie wychodzi dopiero w działaniu.

## Decyzja

Jedno repozytorium Nx w układzie zintegrowanym: jeden `package.json` w katalogu głównym, aplikacje w `apps/`, biblioteki w `libs/`, granice wymuszane tagami `scope:*` i `type:*` (PRD, sekcja 4).

## Odrzucone opcje

- **Osobne repozytoria** – kontrakt trzeba by publikować jako pakiet i synchronizować wersje.
- **Workspace pakietowy (`packages/*`, osobne `package.json`)** – przy jednej wersji każdej zależności dokłada konfiguracji bez korzyści.

## Konsekwencje

Zmiana schematu w `libs/shared/contracts` od razu psuje kompilację po obu stronach. Aktualizacje frameworków robi `nx migrate` dla całego repozytorium naraz.

## Kiedy wrócić do decyzji

Gdy części repozytorium potrzebują różnych wersji tych samych zależności albo osobnych cykli wydań.
