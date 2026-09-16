# M17 — Style Reorganization (Smoothing)

**Depends:** M16 · **Files:** `src/style/*`, all screen components, `vite.config.ts`, `package.json` · **Source:** UX §0 (boundary), existing CSS.

*Goal: replace Tailwind utility classes with a clean CSS custom-property token system + per-screen grid layouts. Keep Tailwind only for shadcn/ui internals. Keep flexbox for component-level layouts. Desktop only.*

## Scope

| Sub-milestone | Focus |
| --- | --- |
| **M17a** | Remove Tailwind from layout; create `src/style/` (tokens + per-screen files); migrate existing CSS |
| **M17b** | Grid layout per screen (run, shop, menu, run-end) with named grid areas |
| **M17c** | Polish pass: spacing consistency, visual verification, tests green |

## Design Decisions

- **Tailwind**: kept ONLY for shadcn/ui components (they depend on it internally). All layout/spacing/typography in our components moves to `src/style/`.
- **CSS custom properties**: a single `tokens.css` defines the design token system (colors, spacing, sizes, fonts, radii, shadows). All values reference tokens, never raw px/hex.
- **Grid**: each screen's root uses `display: grid` with `grid-template-rows` and named `grid-template-areas`. Component-level layouts inside each area can use flexbox.
- **Flex**: kept for component-level layouts (coin rows, badge groups, button groups, etc.).
- **Desktop only**: no responsive breakpoints. Fixed min-width layout.
- **Boundary**: purely presentational. No state, no behavior changes.

## Grid Structures

### Run Screen (5 rows)

```css
.run-screen {
  display: grid;
  grid-template-rows: auto auto 1fr auto auto;
  grid-template-areas:
    "header"
    "charms"
    "hand"
    "play"
    "actions";
}
```

| Area | Content |
| --- | --- |
| `header` | BlindHeader (blind #, target, cash, hands left, save) |
| `charms` | CharmBar |
| `hand` | Hand (8 coins, face-down/face-up) |
| `play` | PlayArea (5 slots + discard well + toss animation space) |
| `actions` | ActionBar (Confirm, Score, Discard) + ScoreTicker |

### Shop Screen (4 rows)

```css
.shop-screen {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  grid-template-areas:
    "header"
    "offers"
    "collection"
    "actions";
}
```

| Area | Content |
| --- | --- |
| `header` | Shop header (blind #, cash, hand size) |
| `offers` | Offer cards (3) + reroll button |
| `collection` | Collection (charms + coin deck) |
| `actions` | Leave button |

### Menu Screen (3 rows)

```css
.menu-screen {
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "title"
    "seed"
    "buttons";
}
```

| Area | Content |
| --- | --- |
| `title` | Game title + tagline |
| `seed` | Seed input + dice button |
| `buttons` | Start / Resume buttons |

### Run-End Screen (3 rows)

```css
.run-end-screen {
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "title"
    "stats"
    "buttons";
}
```

| Area | Content |
| --- | --- |
| `title` | Win/Lose title |
| `stats` | Run stats (blinds cleared, cash, seed) |
| `buttons` | Play Again / Menu buttons |

## `src/style/` Structure (flat)

```
src/style/
  tokens.css      # CSS custom properties: colors, spacing, sizes, fonts, radii, shadows
  run.css         # Run screen: grid layout + component styles (hand, play, actions, charms, header)
  shop.css        # Shop screen: grid layout + component styles (offers, collection, actions)
  menu.css        # Menu screen: grid layout + component styles
  run-end.css     # Run-end screen: grid layout + component styles
```

Each screen file is imported by its page component. `tokens.css` is imported once in `index.css` (or `main.tsx`).

## Token System (`tokens.css`)

```css
:root {
  /* Colors */
  --color-bg: #0f1117;
  --color-surface: #1a1d27;
  --color-border: #2a2d3a;
  --color-text: #e8eaf0;
  --color-text-dim: #8b8fa3;
  --color-primary: #f0c040;
  --color-success: #4ade80;
  --color-danger: #f87171;
  --color-info: #60a5fa;
  --color-heads: #f0c040;
  --color-tails: #a0a8c0;

  /* Spacing (4px base) */
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 20px;
  --sp-6: 24px;
  --sp-8: 32px;
  --sp-10: 40px;
  --sp-12: 48px;
  --sp-16: 64px;

  /* Sizes */
  --size-coin: 56px;
  --size-coin-sm: 40px;
  --size-slot: 64px;
  --size-icon-sm: 12px;
  --size-icon-md: 20px;
  --size-icon-lg: 28px;

  /* Typography */
  --font-display: 'Fredoka', sans-serif;
  --font-body: 'Geist', sans-serif;
  --text-xs: 11px;
  --text-sm: 13px;
  --text-md: 15px;
  --text-lg: 18px;
  --text-xl: 24px;
  --text-2xl: 32px;

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 8px rgba(0,0,0,0.4);
  --shadow-lg: 0 8px 16px rgba(0,0,0,0.5);

  /* Motion */
  --duration-fast: 150ms;
  --duration-med: 300ms;
  --duration-slow: 500ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
}
```

## Checkpoints

### M17a — Tokens + Remove Tailwind from Layout

- [ ] 17a.1 Create `src/style/tokens.css` with the full token system (colors, spacing, sizes, fonts, radii, shadows, motion).
- [ ] 17a.2 Create `src/style/run.css`, `src/style/shop.css`, `src/style/menu.css`, `src/style/run-end.css` — migrate existing CSS from `src/components/*/` and `src/pages/` into these files.
- [ ] 17a.3 Remove all Tailwind utility classes from non-shadcn components (className strings). Replace with semantic CSS classes defined in `src/style/`.
- [ ] 17a.4 Keep Tailwind plugin + config for shadcn/ui only. Remove Tailwind from any component that doesn't use shadcn.
- [ ] 17a.5 Update `index.css` / `main.tsx` to import `tokens.css` + screen files.
- [ ] 17a.6 Verify: `npm run build` clean, tests green, visual parity (no layout shifts).

### M17b — Grid Layout Per Screen

- [ ] 17b.1 Run screen: `display: grid` with 5 named areas (header/charms/hand/play/actions).
- [ ] 17b.2 Shop screen: `display: grid` with 4 named areas (header/offers/collection/actions).
- [ ] 17b.3 Menu screen: `display: grid` with 3 named areas (title/seed/buttons).
- [ ] 17b.4 Run-end screen: `display: grid` with 3 named areas (title/stats/buttons).
- [ ] 17b.5 Component-level layouts inside grid areas use flexbox (coin rows, badge groups, button groups).
- [ ] 17b.6 Verify: `npm run build` clean, tests green, visual parity.

### M17c — Polish + Verify

- [ ] 17c.1 Spacing consistency: all gaps/margins/padding reference tokens (no raw px).
- [ ] 17c.2 Color consistency: all colors reference tokens (no raw hex in component CSS).
- [ ] 17c.3 Font consistency: all font-size/family/weight reference tokens.
- [ ] 17c.4 Dead CSS cleanup: remove any orphaned rules from the old Tailwind era.
- [ ] 17c.5 Full test suite green (423+ tests).
- [ ] 17c.6 `tsc -b` clean, `eslint` clean.
- [ ] 17c.7 Visual smoke test: all 4 screens render correctly, animations work, no console errors.

## Constraints

- **No behavior changes**: purely presentational. State, logic, animations unchanged.
- **Keep Tailwind for shadcn/ui**: the `@tailwindcss/vite` plugin stays; shadcn components keep their Tailwind classes.
- **Desktop only**: no `@media` queries, no responsive breakpoints.
- **No `@keyframes`** outside documented exceptions (button.css `btn-cta`/`btn-flash` + particle engine).
- **No module-level `requestAnimationFrame`** for animation (only `particles.ts`).
- **Reduced motion parity**: every animation keeps its reduced-motion path.
- **Tests must stay green**: update CSS class selectors in tests where needed, but preserve semantic assertions.

## Exit Gate

- `npm run build` clean
- 423+ tests green
- `tsc -b` + `eslint` clean
- All 4 screens use `display: grid` with named areas
- All colors/spacing/fonts reference CSS custom properties
- No Tailwind utilities in non-shadcn components
- Visual parity with pre-M17 build (no layout shifts)
