# ADR-0003: NestJS i PostgreSQL jako backend

- Status: przyjęta
- Data: 2026-10-09

## Kontekst

Backend ma dawać pełną kontrolę nad logiką i uprawnieniami, a zespół zna architekturę Angulara.

## Decyzja

NestJS (moduły, DI, guardy jak w Angularze) z bazą PostgreSQL. Dostęp do bazy tylko przez `libs/api/database`.

## Odrzucone opcje

- **Supabase jako cały backend** – logika rozproszona między RLS, funkcje SQL i edge functions.

## Konsekwencje

Własny kod auth i migracji do utrzymania. Wersję NestJS wyznacza wsparcie w `@nx/nest` (ADR-0010).

## Kiedy wrócić do decyzji

Gdy aplikacja nie potrzebuje własnej logiki serwera poza CRUD i auth.
