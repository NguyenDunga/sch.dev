# M19 — Coin Wedge / Radial Reveal

**Depends:** M18 · **Files:** `src/components/hand/coin/radial-reveal.tsx` (new), `src/components/hand/coin/coin-glyph.tsx` (rewrite), `src/lib/icons.tsx` (per-effect face-stage glyph+color registry), `src/components/hand/coin-disc.tsx`, `src/components/hand/coin/coin.tsx`, `src/components/hand/toss-coin.tsx`, `src/pages/debug-coin.tsx` (larger detail view), `src/components/hand/coin/coin.css` · **Source of truth:** [SDD Component Design](../../sdd/software_design_component.md) C3/C6 · Conventions: [overview](plan_wbs-overview.md).

*Goal: replace the M18 composite glyph (base + left tip + right tip) with a circular hover-reveal — a conic-gradient ring (one wedge per effect) around a disk that shows the highest-priority effect by default and radially wipes in the hovered effect. Each effect carries its own 3 glyphs + 3 colors (one per face stage H / T / face-down); the coin's face stage is shown as the ring color.*

## Design Decisions (Q&A 2026-09-17)

Locked by question round; these override the M18 composite-glyph defaults.

1. **RadialReveal component** (new, general-purpose, `src/components/ui/radial-reveal.tsx`):
   - A circular hover-reveal built from two concentric layers:
     - **Ring** — an outer color-coded band (conic-gradient) with N hover zones (one per item).
     - **Disk** — an inner content area that reveals the active zone's content via a radial wipe (`clip-path: circle`) that appears to emanate from the direction of that zone.
   - Hovering the **disk itself** collapses back to the default.
   - **Library-agnostic**: works with any icon component (react-icons, lucide, custom SVG) that accepts `{ size, className, color, aria-hidden }`.
   - Techniques: conic-gradient ring · SVG pie-slice hit areas (`polarToCartesian` + large-arc-flag) · Framer Motion `animate` on `clipPath` (0%→75%) · directional origin via trig (wedge mid-angle projected onto the disk edge) · `onMouseEnter` on the disk collapses to default.
   - Used in **both** the hand coin (small ~56px) **and** a larger detail/debug view.

2. **Wedge semantics** (per-coin):
   - **One wedge per effect** the coin currently has.
   - The **disk (center) default** = the **highest-priority** effect's icon.
   - **Hovering a wedge** reveals that effect's icon — so you can see the *other* effects on the same coin, not just the top one.

3. **Face-stage config** (per-effect, per-face-stage):
   - Face stages: **H / T / face-down** (3 phase stages), configured separately.
   - Each effect has its own **3 completely different icons** (one per face stage) — not the same glyph in 3 tints.
   - Each effect has its own **3 colors** (one per face stage) — a simple palette derived from the face-stage tones (gold / slate / gray); there are not many colors to define.
   - The coin's **face stage is displayed as the ring color** (all wedges use the face-stage color).
   - Total: 11 effects × 3 face stages = **33 glyphs** + **33 color slots** (colors drawn from the small face-stage palette).

4. **Scope**: the RadialReveal replaces the composite glyph in the hand coin (small ~56px) and is also used in a larger detail/debug view.

## Contract

```ts
// radial-reveal.tsx
export interface RadialRevealItem {
  color: string                       // the wedge's color (a CSS color)
  icon: ComponentType<IconProps>      // icon revealed when this zone is hovered
  label?: string                      // a11y label
}
export interface RadialRevealProps {
  items: RadialRevealItem[]           // one per ring zone
  defaultIcon?: ComponentType<IconProps>  // center/default icon
  defaultColor?: string               // default icon color
  defaultLabel?: string               // a11y label for the default
  size?: number                       // overall diameter in px (default 120)
  ringWidth?: number                  // ring thickness in px (default 12)
  iconSize?: number                   // icon size in px (default = size * 0.4)
}

// lib/icons.tsx — per-effect, per-face-stage glyph + color registry
export interface EffectFaceConfig {
  H:        { icon: ComponentType<IconProps>; color: string }
  T:        { icon: ComponentType<IconProps>; color: string }
  facedown: { icon: ComponentType<IconProps>; color: string }
}
export const EFFECT_FACE_CONFIGS: Record<CoinEffectKind, EffectFaceConfig>

// coin-glyph.tsx — replaced by RadialReveal:
//   items        = the coin's effects (one wedge each, using the per-face-stage
//                  glyph + color for the coin's current face stage)
//   defaultIcon  = the highest-priority effect's glyph (for the current face stage)
//   ring color   = the face-stage color (H=gold / T=slate / face-down=gray)
```

## Checkpoints

- [x] 19.1 Create `src/components/hand/coin/radial-reveal.tsx`: the general-purpose RadialReveal (conic-gradient ring, SVG pie-slice hit areas, Framer Motion `clipPath` reveal 0%→75%, directional origin via trig, disk-hover collapse to default).
- [x] 19.2 `lib/icons.tsx`: add `EFFECT_FACE_CONFIGS` — per-effect, per-face-stage glyph + color registry (11 effects × 3 face stages = 33 glyphs + 33 color slots, colors from the gold/slate/gray face-stage palette).
- [x] 19.3 Rewrite `coin-glyph.tsx` to render the RadialReveal: items = the coin's effects (one wedge each, per-face-stage glyph + color), defaultIcon = highest-priority effect's glyph (current face stage), ring color = face-stage color.
- [x] 19.4 Update `coin-disc.tsx` + `coin.tsx` + `toss-coin.tsx` to render the new RadialReveal-based glyph (small ~56px in the hand).
- [x] 19.5 Add a larger detail/debug view on `/debug/coin` (a bigger RadialReveal per coin).
- [x] 19.6 `coin.css`: add RadialReveal styles (ring, disk, reveal layers); remove the M18 composite-glyph styles (base + tips).
- [x] 19.7 Update tests: verify the RadialReveal renders (ring, disk, hover reveal); update any tests that assert the old `.coin-glyph` composite structure.
- [x] 19.8 `tsc -b`, `npm run lint`, `vitest run`, `npm run build` all green.

## Exit gate

`tsc -b` + `npm run lint` + `vitest run` + `npm run build` all green; the RadialReveal renders the ring (one wedge per effect) + the disk (highest-priority effect by default); hovering a wedge radially wipes in that effect's glyph from the correct edge direction; hovering the disk collapses back to the default; the face stage is shown as the ring color; the `/debug/coin` page shows a larger RadialReveal per coin.

## Status — DONE (2026-09-17)

- 19.1–19.3, 19.5, 19.7 were already in the working tree when this milestone was picked up (RadialReveal + tests, `EFFECT_FACE_CONFIGS`, the `coin-glyph.tsx` rewrite, the `/debug/coin` DetailRow, updated coin/hand-coin tests).
- Completed this session: contract alignment of `radial-reveal.tsx` (optional `defaultIcon`/`defaultColor`/`defaultLabel`, `size` default 120, `ringWidth` default 12, `iconSize` default `size * 0.4`, optional item `label`; conic-gradient background extracted to `ringBackground` to stay under the 120-line lint cap); test fixes (`afterEach(cleanup)` per repo convention, `waitFor` for the AnimatePresence exit wipe); `coin.css` unterminated-comment fix; `coin-disc.tsx` M18 comment cleanup + 44px glyph sizing for the 56px disc; `toss-coin.tsx` now renders the RadialReveal glyph on both toss faces (H front / T back) and in the reduced-motion crossfade (44px).
- Follow-up: moved `radial-reveal.tsx` (+ test) from `src/components/ui/` to `src/components/hand/coin/` (coin-specific, colocated); fixed negative icon size on tiny coins (24px debug size → 10px glyph: ring width clamped to ≤ half the glyph, defensive `Math.max(0, …)` clamps in RadialReveal).
- Follow-up (glyph shapes by effect count): 0 effects → face-state icon; 1 effect → that effect's per-face-stage glyph directly (`.coin-glyph-solo`, no ring); 2+ effects → RadialReveal where the ring wedges are only the NON-top effects (the highest-priority effect is the disk default, so it gets no wedge). Removed shell tilt/scale from the visual chain (configs, resolver, types, tests).
- Follow-up (hover pick-up): removed the 3D pointer tilt (rotateX/rotateY springs in `hand-coin.tsx` + `coin-motion.tsx`) — it made the center glyph drift a few px toward the pointer (down-right) instead of lifting. Hover is now a clean CSS pick-up: `.hand-coin-lift` (renamed from `.hand-coin-tilt`) and `.coin` lift 4px on hover (2px press), gated off under reduced motion. Deal flight + shake unchanged.
- Follow-up (glyph text): small uppercase short name below the icon, everywhere — the RadialReveal disk (top effect), the wedge reveal (hovered effect), and the solo glyph (the effect, or the face name for plain coins). Short names live in `EFFECT_ICONS[*].short` (icons.tsx); `RadialReveal` gained `short` (items) + `defaultShort` (disk) props. Text auto-fits the disk: `fitTextSize` (fit-text.ts) shrinks the font until the estimated width (chars × 0.65em) fits the chord at the label's position (10% margin, 4px floor, hidden when no room) — so long names like "Magnetic" shrink on small coins.
- Follow-up (debug demo + contrast fixes): (1) the debug page's effect/combo rows now include a Face-down row (was H/T only); (2) the detail rows render the full 5-layer `Coin` at 120px (was a bare `CoinGlyph`, which looked completely different from the H/T rows); (3) plain coins (0 effects) show no text — a pure H/T/face-down is its own archetype; (4) the solo glyph now sits on a light `var(--surface)` disk (like the RadialReveal's disk) — the H/T face fills are solid color, so a same-tone icon drawn directly on them was invisible (e.g. the heads effect's gold glyph on the gold H face).
- Follow-up (pick demo): the debug page gained a "Pick / Unpick (click into play)" section — the real `HandCoin` ↔ `PlaySlot` shared-layout animation (same coin id): click the hand coin to pick it into the play slot (spring-snappy), click it in the slot to unpick it back (spring-soft). Smoke test: `debug-coin.pick.test.tsx`.
- Exit gate: `tsc -b` + `npm run lint` + `vitest run` (47 files / 512 tests) + `npm run build` all green.

## Process notes

- When uncertain, ask **directly in plain text** — don't loop on the question tool.
- Keep responses concise; don't repeat yourself.
