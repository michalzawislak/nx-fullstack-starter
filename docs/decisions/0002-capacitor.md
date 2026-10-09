# ADR-0002: Capacitor jako warstwa mobilna

- Status: przyjęta
- Data: 2026-10-09

## Kontekst

Starter ma dawać aplikację web oraz aplikacje iOS i Android z jednej bazy kodu Angular, z publikacją w sklepach.

## Decyzja

Capacitor 8 pakuje statyczny build Angulara w projekty natywne. Kod zależny od platformy jest wyłącznie w `libs/web/core/platform`, za interfejsami i tokenami (PRD, sekcja 5.2).

## Odrzucone opcje

- **NativeScript** – osobne widoki, mała społeczność.
- **Flutter** – Dart, brak współdzielenia kodu z Angularem.
- **Samo PWA** – brak sklepów, ograniczone API na iOS.

## Konsekwencje

Słabsza wydajność ciężkich animacji i bardzo długich list na słabszych Androidach, brak pracy w tle bez kodu natywnego. Wymóg Apple 4.2 spełniają zachowania natywne MOB-5 do MOB-11.

## Kiedy wrócić do decyzji

Gdy aplikacja opiera się na złożonych animacjach sterowanych gestami, długiej pracy w tle albo natywne odczucie jest jej główną cechą. Wtedy rozważ NativeScript dla warstwy widoku; kontrakt, `core/http`, `core/auth` i backend zostają.
