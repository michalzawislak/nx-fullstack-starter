# ADR-0011: Polityka audytu zależności

- Status: przyjęta
- Data: 2026-10-09

## Kontekst

QA-12 wymaga, by podatności high i critical przerywały pipeline. Po dodaniu `@nx/nest` w kroku 2 `npm audit` zgłasza 8 podatności high, wszystkie z jednego źródła: `braces` (DoS przez głęboko zagnieżdżone wzorce), używanego przez `chokidar` i `micromatch` w `webpack-dev-server`. To narzędzie deweloperskie Nx i webpacka; podatność obejmuje wszystkie wersje `braces`, więc nie ma wersji z poprawką. Zależności produkcyjne (`npm audit --omit=dev`) są czyste.

## Decyzja

- CI przerywa pipeline na `npm audit --omit=dev --audit-level=high`.
- Pełny `npm audit` (z zależnościami deweloperskimi) jest uruchamiany i raportowany, ale nie blokuje.
- Podatności w zależnościach deweloperskich, dla których istnieje poprawka, naprawiamy przez `overrides` w `package.json`, opisując każdy wpis w ADR (jak `undici` w ADR-0009).

## Odrzucone opcje

- **Blokowanie na pełnym audycie** – pipeline byłby czerwony bez możliwości naprawy po naszej stronie.
- **Usunięcie webpacka z builda API** – esbuild nie emituje metadanych dekoratorów, których potrzebuje DI NestJS, a `@nx/webpack` i tak instalują `@nx/angular` i `@nx/web`.

## Konsekwencje

Podatności w narzędziach deweloperskich są widoczne w raporcie CI i wymagają okresowego przeglądu, ale nie zatrzymują pracy.

## Kiedy wrócić do decyzji

Gdy `braces` lub `webpack-dev-server` wyda poprawkę: wtedy dodać `overrides` albo zaktualizować zależność i rozważyć powrót do blokowania na pełnym audycie.
