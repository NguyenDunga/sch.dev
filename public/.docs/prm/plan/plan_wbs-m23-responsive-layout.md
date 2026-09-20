# M23 — Responsive Rework (PC · Laptop · Tablet · Phone)

**Depends:** M12 (UI screens), M13 (juice) · **Files:** `src/index.css` (`@theme`: fluid size/typography tokens, breakpoint tokens, custom variants — the single source of responsive config), `src/style/screens/run.css` + `src/pages/run/*` (grid → responsive areas via Tailwind utilities), `src/style/screens/menu.css` + `src/pages/menu.tsx`, `src/style/screens/run-end.css` + `src/pages/run-end.tsx`, `src/components/hand/coin/coin.css` + `hand.css` (fluid coin size, touch interactions), `src/components/shop/shop.css` + `src/pages/shop.tsx` (offer grid columns), `src/components/component.css` (shared hit-target + tap rules), `src/components/hand/*` (tap-to-place alongside drag), `src/components/ui/*` (shadcn primitives — existing `button`/`card`/`icon`; add `dialog`/`sheet`/`popover` as needed for responsive overlays), `index.html` (meta/`theme-color`) · **Source of truth:** [SDD UX](../../sdd/) §2–§3 · Conventions: [overview](plan_wbs-overview.md).

*Goal: the game is currently a single fixed-width portrait column (max 46rem, 96px coins, 64px slots, one 7-row grid, no width breakpoints). It looks thin and empty on a desktop PC, and overflows / forces horizontal scroll on small phones. Rework the layout so every screen is usable and pleasant on: desktop PC (≥1440px), laptop (1024–1439px), tablet (600–1023px, portrait and landscape), and phone (320–599px, portrait and landscape) — with touch as a first-class input on every device.*

## Current State (audit)

| Issue | Where |
| --- | --- |
| No width breakpoints — only `prefers-reduced-motion` queries exist | all CSS |
| Fixed coin 96px / slot 64px — 8 hand coins + 5 play slots don't fit 320–375px widths | `tokens.css`, `coin.css`, `run.css` |
| Run screen is one 7-row column capped at 46rem — desktop shows a narrow strip with dead space on both sides | `run.css` |
| Shop offer grid and wiki are single-column-ish; no column scaling with width | `shop.css` |
| Drag-and-drop is the primary play interaction; tap-to-place is not a complete alternative (touch users can't reliably drag 96px coins) | `hand/*` |
| Keyboard hints (1–0, D, Enter, Space) shown on touch devices where they don't apply | run screen |
| Display type is fixed `rem` — no fluid scaling between phone and desktop | `tokens.css` |
| Landscape phones (short height ~375px) get a tall scrolling column; no compact mode | `run.css` |
| Two styling systems in parallel: hand-rolled CSS files + Tailwind v4 (`@theme`, shadcn) — responsive behavior has no consistent home | `src/style/*` vs `src/components/ui/*` |
| Interactive chrome is a mix of hand-rolled buttons/overlays and shadcn primitives; the wiki overlay is one fixed implementation at every width | `run/*`, `wiki/*` |

## Design Decisions

1. **Tailwind is the one layout system.** All responsive *layout* (breakpoints, columns, stacking, widths) is expressed with Tailwind utilities in JSX (`md:`, `lg:`, `xl:` prefixes) — the same system `components/ui` (shadcn) already uses. No separate `responsive.css`, no raw `@media` width queries in component CSS. Component CSS files keep only what utilities can't express: keyframes/juice, pseudo-element chrome, and `prefers-reduced-motion` rules.
2. **All responsive config lives in `@theme` in `index.css`.** Breakpoints, fluid sizes, and custom variants are declared once in `@theme` / `@custom-variant`; utilities and existing CSS vars consume them. One place to tune, consistent across screens.
3. **Fluid sizes instead of a second set of fixed sizes.** Coin/slot/typography tokens become `clamp()`-based inside `@theme` (e.g. `--size-coin: clamp(56px, 12vw, 96px)`), so there is no per-breakpoint size table to maintain. Breakpoints are used for **layout topology** (columns, stacking, which panels move where), not for re-picking px values.
4. **Run screen topology per class:**
   - **Phone (base):** single column, unchanged order (header → score → charms → tiers → hand → play → actions); coins shrink via the fluid token; the 8-coin hand wraps to 4×2 when needed.
   - **Tablet portrait / laptop (`md:`):** single column, `max-width` widened (46rem → 52rem), more breathing room; shop grid goes 2→3 columns.
   - **Tablet landscape / desktop (`lg:` ≥1024px):** two-column layout — left rail (blind header, score ticker, charm bar, tier reference) and main column (hand, play row, actions). The 7-row grid becomes a 2-area grid; nothing is hidden.
   - **Landscape phone (short height):** custom variant `landscape-short` (`max-height: 480px` + landscape) — charms and tiers collapse into a single scrollable strip, play row and hand stay fully visible (the two things the player touches every hand).
5. **Tap is a complete, first-class alternative to drag.** The existing tap model already covers play: tap a hand coin → it picks into the play row; tap a play slot → it unpicks; tap a landed coin → Echo flip. The one missing touch path was **discard** (previously drag-to-well or the D key only): **tapping the discard well** now discards (1) the selected hand coins, or (2) the last picked coin (unpicked, then discarded); with nothing to discard the tap still toggles the pile panel. Drag keeps working on all devices. This makes the whole game playable by touch on phone/tablet with zero mouse.
6. **Input-aware chrome via Tailwind pointer variants.** Keyboard hints render only under `pointer-fine:` (Tailwind v4 built-in variant); touch devices get the same information as short labels on the buttons themselves. Hit targets stay ≥44px everywhere (SDD UX §3) — at the smallest coin size the whole coin is the hit target.
7. **shadcn/ui is the one component system for interactive chrome.** All buttons, cards, and overlays use shadcn primitives (`components/ui` — `button`, `card` already in use; add `dialog`, `sheet`, `popover` where the rework needs them) styled by the existing Ceramic Tactile semantic tokens (`--primary`, `--card`, `--ring`, … already mapped in `tokens.css`). Hand-rolled button/overlay markup in game screens is migrated to these primitives. Overlays are responsive per device: the **wiki** is a full-screen `Sheet` on phone and a centered `Dialog` on `md:`+; any new overlay follows the same pattern. No new design tokens — shadcn's semantic tokens already point at the Ceramic Tactile palette.
8. **No core/state changes.** This milestone is pure `src/components/` + `src/pages/` + `src/style/` + `index.html`. Determinism, saves, and the 424-test core suite are untouched.

## Contract

```css
/* index.css — @theme: the single responsive config (Tailwind v4).
   Breakpoints: keep the built-ins sm 640 / md 768 / lg 1024 / xl 1280;
   override here only if playtest demands (pattern: --breakpoint-*).
   Fluid sizes (starting points, tuned in playtest — the pattern is what's locked):
   --size-coin:    clamp(56px, 12vw, 96px)
   --size-slot:    clamp(40px, 8.5vw, 64px)
   --size-coin-sm: clamp(28px, 6vw, 48px)
   --text-2xl:     clamp(1.6rem, 1.2rem + 1.2vw, 2rem)
   --text-3xl:     clamp(2.2rem, 1.6rem + 2vw, 3rem)

   Short-landscape (phone) variant for compact mode:
   @custom-variant landscape-short (@media (max-height: 480px) and (orientation: landscape));
*/
```

```tsx
// Layout topology as utilities in JSX (mobile-first; base = phone):

// run screen container:
//   base:  grid, 7 rows, max-w-[46rem]
//   md:    max-w-[52rem]
//   lg:    max-w-7xl, grid-cols-[minmax(14rem,20rem)_1fr],
//          grid-template-areas:
//            "header  header"  "score  hand"  "charms  play"  "tiers  actions"
//   landscape-short: charms + tiers collapse to one scrollable strip

// shop offers:  grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5
// run-end stats: grid grid-cols-1 md:grid-cols-2
// menu:         single column; md: two-part (seed left, art right)
// keyboard hints: <div className="pointer-fine:grid pointer-coarse:hidden">…</div>

// overlays (shadcn primitives, responsive per device):
//   wiki:  <Sheet> on phone (full-screen, swipe-to-dismiss) · <Dialog> at md:+ (centered)
//   all buttons: shadcn <Button> (existing buttonVariants) — no hand-rolled <button> chrome
//   styling: shadcn semantic tokens only (bg-primary, bg-card, border-border, ring-ring)

// hand/ — interaction contract (component + state, no core changes):
// - selectCoin(slotIdx): tap/click a hand coin toggles selection (glow ring).
// - placeSelected(slotIdx): tap/click a play slot moves the selected coin.
// - discardSelected(): tap/click the discard well discards the selected coin.
// - Existing drag handlers remain; both paths call the same store actions
//   (M4 hand-phase), so tap and drag are behaviorally identical.
// - Keyboard (1–0 / D) continues to map to the same actions.
```

## Status (implemented 2026-07-21)

All checkpoints done except 23.7, which is **N/A**: the UI has no *visible* keyboard hints (only an aria-label mention in `hand-coin.tsx`), so there is nothing to gate behind `pointer-fine:`. The coins were also already fluid (13a.16 `COIN_SIZES` clamps), so 23.1 only covered the remaining fixed tokens. Screen CSS was wrapped in `@layer components` so Tailwind utilities (a later layer) can override the base layout — required for every `md:`/`lg:`/`landscape-short:` utility to take effect.

## Checkpoints

- [x] 23.1 `index.css` `@theme`: convert `--size-coin`, `--size-slot`, `--size-coin-sm`, `--text-2xl`, `--text-3xl` to fluid `clamp()` values; verify no component hard-codes the old px values.
- [x] 23.2 `index.css` `@theme` / `@custom-variant`: breakpoint tokens (default sm/md/lg/xl unless overridden) + `landscape-short` variant — the only responsive config in the codebase.
- [x] 23.3 Run screen (base/phone): grid stays single column; no horizontal scroll at 320px. (The 8→4×2 wrap was superseded by the existing 13a.13/13a.16 design: the hand is always one line and the coins shrink fluidly — verified smaller, not wrapped.)
- [x] 23.4 Run screen `md:` / `lg:` utilities: widened single column at `md:`; two-column topology (left rail / main column) at `lg:` per decision 4.
- [x] 23.5 `landscape-short:` compact mode: charms/tiers collapse to one strip; hand + play row always visible without scrolling.
- [x] 23.6 `hand/*`: tap-to-place + tap-to-discard as complete alternatives to drag (decision 5); selection state reuses the existing glow ring; works with the Echo tap on landed coins without conflict.
- [~] 23.7 Keyboard hints — **N/A**: no visible keyboard hints exist in the UI (only an aria-label mention), nothing to gate.
- [x] 23.7b shadcn: add `dialog` + `sheet` (+ `popover` if needed) to `components/ui`; wiki renders `Sheet` on phone / `Dialog` at `md:`+; hand-rolled button/overlay markup in game screens migrated to shadcn primitives (decision 7).
- [x] 23.8 Shop / run-end / menu: column scaling via utilities (shop `grid-cols-2 md:grid-cols-3 lg:grid-cols-5`, run-end `md:grid-cols-2`, menu two-part at `md:`).
- [x] 23.9 `index.css` / `index.html`: `theme-color` meta, `100dvh` audit (no 100vh leftovers), overscroll behavior locked on phone.
- [x] 23.10 `css-validation.test.ts` + `screens.smoke.test.tsx`: add render/width assertions — no horizontal overflow at 320 / 375 / 768 / 1024 / 1440; all interactive elements ≥44px at 320px; full run (draw → play → toss → score → shop) completable via tap-only actions in the test harness.
- [x] 23.11 Grep gate: zero raw `@media (min-width:` / `(max-width:` width queries outside `index.css` (pointer/reduced-motion/`landscape-short` variants excepted) — layout is utilities-only.

## Acceptance Criteria

1. **No horizontal scroll** at 320, 360, 390, 430, 768, 820, 1024, 1280, 1440, 1920 on every screen (menu, run, shop, run-end, wiki).
2. **Full game playable by touch alone** (no drag, no keyboard) on a 375px phone and a 768px tablet portrait.
3. **Full game playable by mouse + keyboard alone** on desktop, unchanged from today.
4. Desktop (≥1024px) shows the two-column run layout — no narrow centered strip with dead side space.
5. Landscape phone shows compact mode with hand + play row always visible.
6. All interactive targets ≥44px at every width.
7. All responsive layout is Tailwind utilities + `@theme` config (checkpoint 23.11 grep gate); all interactive chrome is shadcn/ui primitives styled by the existing Ceramic Tactile semantic tokens — one styling system end to end.
8. Core/state suites (424 tests) pass unchanged; determinism rule (same seed + actions ⇒ identical run) holds for tap and drag inputs alike.
