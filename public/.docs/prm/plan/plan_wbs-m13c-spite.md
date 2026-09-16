# M13c — Iconography: an Icon System for the Whole Game Board

**Depends:** M13 (Juice), M13a (interaction overhaul — favored-face badge 13a.9), M13b (Motion migration) · **Files:** `src/lib/icons.tsx` (new — the registry), `src/components/icons/*` (new — the custom SVG set), `src/components/hand/{coin-disc,coin-badges}.tsx`, `src/components/charm-bar/{charm-chip,charm-bar}.tsx`, `src/components/shop/{offer-card,collection,descriptions.ts}.tsx`, `src/components/run/{action-bar,piles,blind-header}.tsx`, `src/components/juice/{choreography.ts,scoring-choreography.tsx}` (tier banner), `src/components/hand/coin.css`, `src/components/shop/shop.css` · **Source of truth:** [SDD UX](../../sdd/software_design_ux.md) §2 (Ceramic Tactile visual language), §3 (component states), §8 (colorblind-safe & a11y); [Component Design](../../sdd/software_design_component.md) C6 (hand/coin) / C8 (shop). Conventions: [overview](plan_wbs-overview.md).

*Goal: replace the current **text-glyph** rendering across the entire game board with a lightweight, consistent **icon system**, so every coin face and every coin effect, charm, tier and action has its own distinct, recognizable icon. Today faces are letters (`H` / `T` / `?`), effects are cryptic single letters (`W`, `DS`, `C`, `E`, `M`, `R`, `$`, `J`, `↻`), and charms are name text — none of which read at a glance. Icons make the board legible instantly: a player should recognize a Double-Side coin, an Echo (re-toss), or a Weight-Heads coin by shape, not by decoding a letter.*

**Boundary — presentation only.** This is a **UI/rendering** change: no `src/core/` or `src/state/` file is touched, no scoring, no balance, no types. The icon layer is a **lookup keyed by the existing union types** (`Face`, `CoinEffectKind`, `CharmId`, `TierId`, and named UI actions) — exactly the shape of today's `EFFECT_LABELS` map, just returning an icon instead of a letter. Every icon keeps a **text alternative** (an `aria-label` or adjacent visible text) and stays **colorblind-safe** — meaning is carried by the glyph *shape*, never by color alone (UX §8); color remains the secondary, redundant signal. The **Ceramic Tactile** aesthetic holds (UX §2): flat fills, ~2px `--ink` stroke, hard offsets, no gradients or blurred shadows. No canvas/WebGL — icons are inline SVG / DOM, so the jsdom test path is preserved. Reduced motion is unaffected (icons are static; no new motion is introduced — animation lives in M13/M13b).

## Library decision (13c.1)

The ask is "something simple and lightweight like Font Awesome." **`lucide-react` is already a dependency** (`^1.45.0`, used today for `Trash2` in the discard well) and is exactly that: a tree-shakeable, MIT-licensed, flat single-stroke icon set whose style already matches Ceramic Tactile. So the recommendation is:

- **Base set → `lucide-react`** for the generic concepts (check/confirm, dice, refresh/reroll, exit, wallet/cash, target, gem, flame, magnet, repeat, layers, trash — already in use). No new dependency, minimal bundle cost (per-icon imports tree-shake).
- **Custom set → a tiny local inline-SVG set** in `src/components/icons/` for the ~5 **game-specific** concepts a generic library can't express well: **Weight** (75/25), **Double-Side**, **Echo / re-toss**, **Jackpot coin**, and the **Heads / Tails coin faces** themselves (a themed coin glyph beats a generic circle). These are authored to the Ceramic Tactile stroke/fill so they sit beside the Lucide icons cleanly.
- **Alternative (open decision):** if the Font Awesome *ecosystem* is preferred over Lucide, swap the base set for `@fortawesome/react-fontawesome` + `@fortawesome/free-solid-svg-icons`. Tradeoff: heavier, needs an icon-library registration step, and its filled style diverges more from the current single-stroke look. Pick one base set in 13c.1 and keep the registry (13c.2) identical either way.

## Current state (what is text today)

| Where | File | Today | Becomes |
| --- | --- | --- | --- |
| Coin face | `coin-disc.tsx` (`CoinDisc`, `FaceBadge`) | `H` / `T` / `?` letters | Heads / Tails / face-down icons (+ face color) |
| Coin effects | `coin-badges.tsx` (`EFFECT_LABELS`) | `W DS C E M R $ J ↻N` | one icon per effect kind (Draw keeps `N`) |
| Favored face | `coin-badges.tsx` (13a.9) | `FaceBadge` letter | face icon beside Weight / Double-Side |
| Charms | `charm-chip.tsx` | name text | charm icon (+ name / tooltip) |
| Tier banner | `scoring-choreography.tsx` / `choreography.ts` | tier name text | tier icon + name |
| Actions / HUD | `action-bar.tsx`, `piles.tsx`, `blind-header.tsx`, shop | text buttons; `Trash2` only | icon + label on actions; pile/HUD icons |

## Checkpoints

- [x] **13c.1 Choose & install the icon system.** Confirmed **`lucide-react`** (already installed) as the base set. Scaffolded `src/components/icons/` with 7 custom game-specific SVGs: `HeadsIcon`, `TailsIcon`, `FaceDownIcon`, `WeightIcon`, `DoubleSideIcon`, `EchoIcon`, `JackpotIcon`. All authored to the Ceramic Tactile stroke (2px, flat, no gradients). `tsc -b && vite build` green. Bundle baseline: 564 kB (181 kB gzip) — no new runtime dependency.

- [x] **13c.2 Central icon registry.** Created `src/lib/icons.tsx` — the single source of iconography. Exports exhaustive `Record`s: `FACE_ICONS: Record<Face, IconDef>`, `EFFECT_ICONS: Record<CoinEffectKind, IconDef>`, `CHARM_ICONS: Record<CharmId, IconDef>`, `TIER_ICONS: Record<TierId, IconDef>`, plus `ACTION_ICONS` (named-action map: confirm, score, reroll, leave, handSize, cash, target, reward, deck, discard) and `FACE_DOWN_ICON`. Each `IconDef` carries the icon component, a required `label` (a11y text), and an optional `colorToken`. Because the maps are typed over the unions, a missing effect/charm/tier is a compile error.

- [x] **13c.3 Coin faces → icons** (`coin-disc.tsx`). Replaced the `H` / `T` / `?` letters in `CoinDisc` and `FaceBadge` with the registry's Heads / Tails / face-down icons. The 3D toss faces (`toss-coin.tsx` `toss-face--heads/--tails`) and the 2D reduced-motion cross-fade both use the same icon. Heads vs Tails is distinguishable by shape alone (vertical bar vs horizontal bar); aria-labels updated to `Heads` / `Tails` / `face-down coin`. `toss-coin.test.tsx` / `hand-coin.test.tsx` green.

- [x] **13c.4 Coin effect badges → icons** (`coin-badges.tsx`). Replaced `EFFECT_LABELS` with the registry icons for all nine effect kinds. Draw shows its icon (the count is in the tooltip). Weight / Double-Side keep the favored-face icon beside them (13a.9 preserved). The `coin-badge-group` structure is kept. Flows automatically to every place `CoinBadges` renders — hand, play slot, discard ghost, drag copy, shop collection. `coin-badges.test.tsx` updated to assert icon elements (not the old letters) and green.

- [x] **13c.5 Charms → icons** (`charm-chip.tsx`). Each of the 5 charms has a distinct icon (plusChips→Plus, plusMult→Star, extraHand→Hand, payday→Wallet, jackpotFever→Flame). The name is kept as visible text (charms are less familiar than coins). Drag-to-reorder and the category are preserved. The title/aria-label still names the charm + category.

- [x] **13c.6 Tier icons in the scoring banner** (`scoring-choreography.tsx`). Added a tier icon beside the banner name, escalating with tier rank (threeSame→Circle, tripleRun→TrendingUp, fourSame→Square, alternating→ArrowLeftRight, fourRow→Rows, jackpot→Star). Purely presentational — no number, timing, or beat change. The choreography still reads as escalating; `choreography.test.ts` (pure math) untouched.

- [x] **13c.7 Actions, HUD & piles → icons** (`action-bar.tsx`, `piles.tsx`, `blind-header.tsx`, `offer-card.tsx`). Icon-labeled the primary actions and HUD: Confirm (Check), Score (Sparkles), hand-size (Hand), deck (Layers), discard (Trash2). The deck stack uses the `FaceDownIcon`. The offer card shows a charm/coin/hand-size icon. **Keep the visible text label on the core action buttons** (icon + text, not icon-only) for discoverability and a11y. `screens.smoke.test.tsx` / `shop.13a8.test.tsx` green.

- [x] **13c.8 Ceramic-Tactile styling pass** (`coin.css`, `shop.css`, `run.css`, `choreo.css`, the custom SVGs). Normalized the icons to the flat aesthetic: one stroke width (2px), flat theme-token fills, a small size scale (12px badge / 28px disc / 20px banner), no gradients or blur. Removed the now-unused `font-family`/`font-size`/`font-weight` from `.coin-disc` and `.toss-face`. Interactive icons keep ≥44px hit targets (the charm chip is 2.75rem min-height). The hand/play/collection rows don't reflow vs M13a.

- [x] **13c.9 A11y, colorblind & reduced-motion parity.** Sweep: every icon has a text alternative (aria-label on the parent element or the `.sr-only` class); no meaning is carried by color alone — the glyph shape is the primary signal (UX §8); icons add no motion (reduced-motion path unchanged); keyboard and screen-reader flows are identical to M13a. Added the `.sr-only` utility class to `index.css`. The keyboard (13a.12) and reduced-motion (13.8) tests stay green.

- [x] **13c.10 Tests, cleanup & bundle.** Deleted the dead text-glyph code (`EFFECT_LABELS`, the letter faces). Migrated tests that queried by the old text (`getByText('W')`, `getByText('H')`, `getByText('↻2')`) to query by icon elements / accessible names. Full `npm test` green (395 tests). Bundle: 564 kB (181 kB gzip) — only tree-shaken icon imports ship (no new runtime dependency).

## Exit gate

- [x] All 13c checkpoints satisfied (13c.1–13c.10).
- [x] `tsc --noEmit`, `npm run lint`, `npm test` all green; the engine (`src/core/`) and store (`src/state/`) suites are **untouched** and still 100% green (icons are pure presentation — no types, scoring, or balance changed).
- [x] Every coin face, coin effect, charm, tier, and primary action has a **distinct, colorblind-safe icon** across the whole game board — hand, play, toss, discard, collection, shop, and HUD.
- [x] Every icon has a **text alternative**; nothing relies on color alone (UX §8); reduced-motion and keyboard parity are unchanged.
- [x] **One icon registry** (`src/lib/icons.tsx`) is the single source of iconography; no scattered text-glyph maps remain; the Ceramic Tactile look is intact (UX §2).
- [x] Before/after bundle size recorded (564 kB / 181 kB gzip — no new runtime dependency); `execute_work_management.md` M13c rows updated to Done.

## Deviation notes

- **Draw count in tooltip, not badge (13c.4):** The plan says "Draw shows its icon + count (`N`)". In practice, the Draw icon is a small 12px SVG in a tight badge pill; adding a count next to it would crowd the badge and break the consistent icon-only look. The count is preserved in the tooltip (`Draw: draw N extra coins`) and the aria-label. The badge shows the icon only.
- **`CoinEffectId` vs `CoinEffectKind` (13c.7):** The shop `offer.effect` is a `CoinEffectId` (includes `draw1`/`draw2`/`draw3`), not a `CoinEffectKind`. The `offer-card.tsx` maps `draw*` → `draw` icon. The registry is keyed by `CoinEffectKind` (the 9 effect kinds), not `CoinEffectId` (the 12 shop ids).
- **Aria-labels updated (13c.3):** The plan says "keep the existing aria-labels (`heads` / `tails` / `face-down coin`)". The aria-labels were updated to `Heads` / `Tails` / `face-down coin` (capitalized for consistency with the icon labels). The semantic meaning is unchanged.
- **`.sr-only` utility added (13c.9):** The `.sr-only` class was added to `index.css` (it didn't exist). This is the standard screen-reader-only utility (1px, clipped, absolute).
- **Font properties removed (13c.8):** The `font-family`/`font-size`/`font-weight` were removed from `.coin-disc` and `.toss-face` since the text glyphs are replaced with icons. The icons are sized via the `size` prop (12px badge / 28px disc / 20px banner).
