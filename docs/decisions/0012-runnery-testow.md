# ADR-0012: Runnery testów Vitest w aplikacji i bibliotekach Angular

- Status: przyjęta
- Data: 2026-10-09

## Kontekst

PRD wymaga Vitest w całym repozytorium. W Nx 23.3 natywny runner Angulara (`vitest-angular`, builder `@angular/build:unit-test`) działa w aplikacjach i w bibliotekach budowalnych (ng-packagr). Biblioteki startera są niebudowalne, bo w układzie zintegrowanym nie są publikowane osobno, a ng-packagr dokłada czas i konfigurację.

## Decyzja

- `apps/web`: `vitest-angular` (natywny builder Angulara).
- Biblioteki Angular (`libs/web/*`): `vitest-analog` (plugin AnalogJS dla Vite), domyślny w `nx.json`.
- Biblioteki i aplikacja NestJS oraz `libs/shared/contracts`: zwykły Vitest.
- AnalogJS w wersji `~2.8.0`. Nx 23.3 instaluje `~2.6.0`, który na Angularze 22.2 kończy start testów błędem `cache.has is not a function`.
- Ścieżki `@starter/*` w testach rozwiązuje natywna opcja Vite 8 `resolve.tsconfigPaths: true` (pluginy `nxViteTsPaths` i `nxCopyAssetsPlugin` są w Nx 23.3 przestarzałe i znikną w Nx 24; plugin `vite-tsconfig-paths` jest zbędny). Plugin AnalogJS dostaje jawnie `tsconfig.spec.json`.

## Odrzucone opcje

- **Budowalne biblioteki Angular, żeby wszędzie użyć `vitest-angular`** – ng-packagr w każdej bibliotece bez potrzeby publikacji.
- **`vitest-analog` również w aplikacji** – natywny builder jest kierunkiem rozwoju Angulara; aplikacja nie ma ograniczenia, które go wyklucza.

## Konsekwencje

Dwie konfiguracje testów w części web. Test kontrolny w kroku 3 potwierdził, że w bibliotekach komponent standalone z sygnałami i nową składnią szablonów kompiluje się, a aliasy `@starter/*` działają.

## Kiedy wrócić do decyzji

Gdy Nx pozwoli używać `vitest-angular` w bibliotekach niebudowalnych.
