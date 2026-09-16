# M17 — Style Reorganization (Smoothing)

**Depends:** M16 · **Files:** `src/style/*`, all screen components, `vite.config.ts`, `package.json` · **Source:** UX §0 (boundary), existing CSS.

*Goal: replace Tailwind utility classes with a clean CSS custom-property token system + per-screen grid layouts. Keep Tailwind only for shadcn/ui internals. Keep flexbox for component-level layouts. Desktop only.*

## Status

**M17: COMPLETE** (2026-09-17)

## Scope

| Sub-milestone | Focus | Status |
| --- | --- | --- |
| **M17a** | Remove Tailwind from layout; create `src/style/` (tokens + per-screen files); migrate existing CSS | ✅ Done |
| **M17b** | Grid layout per screen (run, shop, menu, run-end) with named grid areas | ✅ Done (part of M17a) |
| **M17c** | Polish pass: spacing consistency, CSS validation test, tests green | ✅ Done |

## Design Decisions

- **Tailwind**: kept ONLY for shadcn/ui components (they depend on it internally). All layout/spacing/typography in our components moves to `src/style/`.
- **CSS custom properties**: a single `tokens.css` defines the design token system (colors, spacing, sizes, fonts, radii, shadows). All values reference tokens, never raw px/hex.
- **Grid**: each screen's root uses `display: grid` with `grid-template-rows` and named `grid-template-areas`. Component-level layouts inside each area can use flexbox.
- **Flex**: kept for component-level layouts (coin rows, badge groups, button groups, etc.).
- **Desktop only**: no responsive breakpoints. Fixed min-width layout.
- **Boundary**: purely presentational. No state, no behavior changes.

## Grid Structures

### Run Screen (5 rows)

```
header   → BlindHeader
charms   → CharmBar
hand     → Hand (8 coins)
play     → PlayArea (5 slots + discard well)
actions  → ActionBar + ScoreTicker
```

### Shop Screen (4 rows)

```
header     → Shop header
offers     → Offer cards + reroll
collection → Collection (charms + coin deck)
actions    → Leave button
```

### Menu Screen (3 rows)

```
title   → Game title + tagline
seed    → Seed input + dice
buttons → Start / Resume
```

### Run-End Screen (3 rows)

```
title   → Win/Lose title
stats   → Run stats
buttons → Play Again / Menu
```

## `src/style/` Structure (flat)

```
src/style/
  tokens.css           # CSS custom properties: colors, spacing, sizes, fonts, radii, shadows, motion
  run.css              # Run screen: grid layout + component styles
  shop.css             # Shop screen: grid layout + component styles
  menu.css             # Menu screen: grid layout + component styles
  run-end.css          # Run-end screen: grid layout + component styles
  css-validation.test.ts  # M17c: validates all CSS uses tokens
```

## Checkpoints

### M17a — Tokens + Remove Tailwind from Layout ✅

- [x] 17a.1 Create `src/style/tokens.css` with the full token system.
- [x] 17a.2 Create per-screen CSS files; migrate existing CSS.
- [x] 17a.3 Remove all Tailwind utility classes from non-shadcn components.
- [x] 17a.4 Keep Tailwind plugin + config for shadcn/ui only.
- [x] 17a.5 Update `index.css` to import `tokens.css` + screen files.
- [x] 17a.6 Verify: build clean, tests green, visual parity.

### M17b — Grid Layout Per Screen ✅ (done as part of M17a)

- [x] 17b.1 Run screen: `display: grid` with 5 named areas.
- [x] 17b.2 Shop screen: `display: grid` with 4 named areas.
- [x] 17b.3 Menu screen: `display: grid` with 3 named areas.
- [x] 17b.4 Run-end screen: `display: grid` with 3 named areas.
- [x] 17b.5 Component-level layouts use flexbox.
- [x] 17b.6 Verify: build clean, tests green.

### M17c — Polish + Verify ✅

- [x] 17c.1 Spacing consistency: all gaps/margins/padding reference tokens.
- [x] 17c.2 Color consistency: all colors reference tokens (no raw hex).
- [x] 17c.3 Font consistency: all font-size/family/weight reference tokens.
- [x] 17c.4 Dead CSS cleanup: old component CSS files removed.
- [x] 17c.5 Full test suite green (428 tests / 34 files).
- [x] 17c.6 `tsc -b` clean, `eslint` clean.
- [x] 17c.7 CSS validation test (`css-validation.test.ts`): 5 tests scanning all CSS for raw values.

## Constraints

- **No behavior changes**: purely presentational. State, logic, animations unchanged.
- **Keep Tailwind for shadcn/ui**: the `@tailwindcss/vite` plugin stays.
- **Desktop only**: no `@media` queries, no responsive breakpoints.
- **No `@keyframes`** outside documented exceptions.
- **No module-level `requestAnimationFrame`** for animation (only `particles.ts`).
- **Reduced motion parity**: every animation keeps its reduced-motion path.
- **Tests must stay green**: 428 tests passing.

## Exit Gate

- [x] `npm run build` clean
- [x] 428 tests green
- [x] `tsc -b` + `eslint` clean
- [x] All 4 screens use `display: grid` with named areas
- [x] All colors/spacing/fonts reference CSS custom properties
- [x] No Tailwind utilities in non-shadcn components
- [x] CSS validation test passes (no raw hex/px in component CSS)
