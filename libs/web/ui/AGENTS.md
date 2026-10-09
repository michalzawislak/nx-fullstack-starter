# libs/web/ui

Presentational components and the design tokens of the starter (PRD section 5.4, ADR-0014). Components here know nothing about the API, the session or the platform: data comes in through inputs, events go out through outputs.

- Tokens: `src/styles/_tokens.scss` is the only place for breakpoints, spacing, colours, radii and font sizes (FE-20). Components use the CSS variables (`var(--space-4)`, `var(--color-primary)`); SCSS maps only for media queries via `@include tokens.from(md)`. Mobile first.
- Safe areas: `--safe-area-top/right/bottom/left` (FE-18). Anything touching a screen edge adds them to its padding.
- Global styles: `src/styles/index.scss`, included once by `apps/web/src/styles.scss` (tap highlight, overscroll, 16 px inputs, focus ring).
- Accessibility (FE-19, FE-24): touch targets at least `var(--touch-target)` (44 px), a label for every control (`app-text-field`), visible focus, colours with AA contrast in light and dark themes, live regions for status changes.
- Prefer attribute selectors on native elements (`button[appButton]`) to keep native semantics.
- Every component has a test rendering it through a host component or `setInput`.
