# ADR-0005: Wersjonowanie API od pierwszego dnia

- Status: przyjęta
- Data: 2026-10-09

## Kontekst

Starych wersji aplikacji ze sklepów nie da się wycofać; działają miesiącami.

## Decyzja

Wersja w ścieżce (`/v1`). W obrębie wersji tylko zmiany addytywne. Klient wysyła `X-App-Version` i `X-App-Platform`, a API może wymusić aktualizację kodem `APP_VERSION_UNSUPPORTED` (PRD, CON-4 do CON-7).

## Odrzucone opcje

- **Brak wersjonowania** – każda zmiana łamiąca psuje zainstalowane aplikacje.

## Konsekwencje

Zmiana łamiąca oznacza nowy prefiks i równoległe utrzymanie starego przez ustalony okres.

## Kiedy wrócić do decyzji

Nie przewidujemy.
