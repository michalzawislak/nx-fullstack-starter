# ADR-0015: zod/mini w całym repozytorium

- Status: przyjęta
- Data: 2026-10-09

## Kontekst

Po kroku 7 bundle początkowy aplikacji web miał 471 kB przy progu błędu 500 kB (QA-8, ryzyko R9). Ponad 390 kB to Angular (core, router, common z HTTP), a klasyczny Zod zajmował 116 kB, bo kontrakt jest potrzebny już przy starcie (przywracanie sesji, parsowanie odpowiedzi). Klasyczny Zod ma API metod (`z.string().min(8)`), którego bundler nie potrafi okroić.

## Decyzja

Wszystkie schematy w repozytorium używają `import * as z from 'zod/mini'` (API funkcyjne: `z.string().check(z.minLength(8))`, `z.optional(...)`, `z.pipe(...)`, `z.extend(...)`, `z._default(...)`). Klasyczny import `'zod'` blokuje `no-restricted-imports` w głównej konfiguracji ESLint i w `libs/shared/contracts`.

- `libs/shared/contracts/src/lib/zod-config.ts` ładuje angielskie komunikaty (`z.config(en())`): `zod/mini` bez locale zwraca wszędzie „Invalid input”.
- Typy endpointów (`EndpointContract`) i `SchemaValidationPipe` przyjmują `z.core.$ZodType`, więc działają z każdym schematem Zod.
- `ApiClient` parsuje odpowiedzi funkcją `z.parse(schema, value)`.

## Wynik

Bundle początkowy 471 kB → 406 kB (126 kB → 111 kB po kompresji). Zod w bundlu: 116 kB → 38 kB. Testy kontraktu, API (jednostkowe i integracyjne) i E2E przechodzą bez zmian zachowania.

## Odrzucone opcje

- **Budżet dopasowany do bazy frameworka** – szybkie, ale bundle zostaje większy, niż musi.
- **Klasyczny Zod w API, mini w kontrakcie** – dwa style schematów w jednym repozytorium i reguła lintu zależna od projektu.

## Konsekwencje

- Zapis schematów jest bardziej rozwlekły; wzorce są w skillu `add-endpoint` i w `libs/shared/contracts`.
- Próg ostrzeżenia 300 kB z QA-8 nadal jest przekroczony (406 kB), bo sam framework przekracza go o ponad 90 kB; do progu błędu zostaje 94 kB.

## Kiedy wrócić do decyzji

Gdy Angular zmniejszy bazowy rozmiar bundla albo Zod zmieni sposób dystrybucji wariantów.
