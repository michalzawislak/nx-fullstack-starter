# ADR-0013: Prisma 7 jako ORM

- Status: przyjęta
- Data: 2026-10-09

## Kontekst

Otwarta decyzja z PRD (sekcja 12) do rozstrzygnięcia przed krokiem 5. Starter potrzebuje typowanego dostępu do PostgreSQL, migracji w repozytorium (BE-9) i jednego miejsca dostępu do bazy (BE-10).

## Decyzja

Prisma ORM 7.10.0, przypięta jawnie: tag `latest` w npm wskazuje 8.0.0-rc.22, a Prisma 8 wciąż łamie API.

- Generator `prisma-client` z `moduleFormat = "cjs"` (API jest budowane jako CommonJS); klient generowany do `libs/api/database/src/generated` i nie commitowany.
- Połączenie przez driver adapter `@prisma/adapter-pg` (Prisma 7 nie używa już silnika zapytań w Rust).
- Konfiguracja CLI w `libs/api/database/prisma.config.ts`, ładuje `.env` z katalogu głównego. Komendy przez `npm run db:*`.
- `postinstall` i zależności celów Nx (`^prisma-generate` przed `build`, `test`, `typecheck`) generują klienta automatycznie.

## Odrzucone opcje

- **Drizzle** – bliżej SQL i lżejszy, ale migracje i ich narzędzia są mniej dojrzałe; wybór można powtórzyć w konkretnej aplikacji, bo dostęp do bazy jest tylko w `libs/api/database`.
- **TypeORM** – encje jako klasy pasują stylem do NestJS, ale typowanie zapytań i migracje są słabsze.

## Konsekwencje

- CLI Prismy pobiera silnik schematu z `binaries.prisma.sh`. W środowisku, w którym powstawał krok 5, ten host był zablokowany: `prisma generate` działa wtedy z `PRISMA_SCHEMA_ENGINE_BINARY` wskazującym dowolny plik wykonywalny, ale migracji nie da się wygenerować. Pierwsza migracja (`20261009120000_init`) została więc napisana ręcznie w formacie Prismy i sprawdzona na PostgreSQL 16. Potwierdzeniem zgodności ze schematem jest `npm run db:migrate` na komputerze z dostępem do sieci: nie może zaproponować nowej migracji.
- `@prisma/client` deklaruje `prisma` jako peer, więc `npm audit --omit=dev` liczy zależności CLI jako produkcyjne. Podatności `mysql2` i `deepmerge-ts` są załatane przez `overrides` (polityka z ADR-0011).
- Prisma 7 nie uruchamia `generate` ani seeda po `migrate dev`; trzeba wywołać `npm run db:generate` i `npm run db:seed`.

## Kiedy wrócić do decyzji

Gdy Prisma 8 wyjdzie jako stabilna (migracja dotyczy tylko `libs/api/database`, ryzyko R5) albo konkretna aplikacja potrzebuje SQL, którego Prisma nie wyraża.
