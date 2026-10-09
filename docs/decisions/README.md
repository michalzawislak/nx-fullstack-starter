# Decyzje architektoniczne (ADR)

Każda decyzja z PRD (sekcje 2 i 12) ma tutaj zapis: kontekst, decyzję, odrzucone opcje, konsekwencje i warunek powrotu do tematu. Nową decyzję zapisz na podstawie `0000-szablon.md` z kolejnym numerem. Decyzji nie zmieniamy po cichu: zmiana to nowy ADR, który oznacza stary jako zastąpiony.

| Nr                                   | Decyzja                                                  | Status   |
| ------------------------------------ | -------------------------------------------------------- | -------- |
| [0001](0001-monorepo-nx.md)          | Monorepo Nx                                              | przyjęta |
| [0002](0002-capacitor.md)            | Capacitor jako warstwa mobilna                           | przyjęta |
| [0003](0003-nestjs-postgresql.md)    | NestJS i PostgreSQL jako backend                         | przyjęta |
| [0004](0004-auth-tokeny.md)          | Uwierzytelnianie tokenami z odświeżaniem                 | przyjęta |
| [0005](0005-wersjonowanie-api.md)    | Wersjonowanie API od pierwszego dnia                     | przyjęta |
| [0006](0006-bez-ssr.md)              | Bez SSR, kod gotowy na SSR                               | przyjęta |
| [0007](0007-npm.md)                  | npm jako menedżer pakietów                               | przyjęta |
| [0008](0008-kontekst-ai.md)          | Kontekst dla narzędzi AI z jednego źródła                | przyjęta |
| [0009](0009-angular-22-2.md)         | Angular 22.2 zamiast 22.1 instalowanego przez Nx         | przyjęta |
| [0010](0010-nestjs-11.md)            | NestJS 11 na start                                       | przyjęta |
| [0011](0011-polityka-audytu.md)      | Polityka audytu zależności                               | przyjęta |
| [0012](0012-runnery-testow.md)       | Runnery testów Vitest w aplikacji i bibliotekach Angular | przyjęta |
| [0013](0013-prisma-7.md)             | Prisma 7 jako ORM                                        | przyjęta |
| [0014](0014-wlasne-komponenty-ui.md) | Własne minimalne komponenty UI                           | przyjęta |

Otwarta decyzja o pluginie bezpiecznego magazynu dostanie ADR w kroku 8.
