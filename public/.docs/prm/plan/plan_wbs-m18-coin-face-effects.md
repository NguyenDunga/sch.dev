# M18 — Coin Face Effects & Composite Icons

**Depends:** M7, M12, M13, M17 · **Files:** `src/core/types.ts`, `src/core/scoring.ts` (`resolveFace`), `src/core/balance.ts` (`COIN_EFFECTS`), `src/state/shopActions.ts` (`purchasedEffect`), `src/components/shop/descriptions.ts`, `src/components/hand/coin/**` (effects/, resolver, glyph, badges, coin), `src/lib/icons.tsx`, icon consumers (`menu`, `run`, `piles`, `onboarding-hint`, `save-button`, `button`, `debug`) · **Source of truth:** [SDD Component Design](../../sdd/software_design_component.md) C3/C6; [Balance Baseline](plan_balance-baseline.md) → Coin Effects · Conventions: [overview](plan_wbs-overview.md).

*Goal: give every coin face state (Heads / Tails / Face-down) a first-class effect + a special display, replace Double-Side with Heads/Tails, and rework the coin icon into a single composite glyph (base + tips) built from `react-icons`. The badge footer (tiny icon pills) is removed.*

## Design Decisions (Q&A 2026-09-17)

Locked by question round; these override the M7 defaults where they differ.

1. **Three new effects** (gameplay + visual):
   - `heads` — always lands **H** (replaces Double-Side H).
   - `tails` — always lands **T** (replaces Double-Side T).
   - `facedown` — **visual-only**: special hand display for the face-down state. **No core change** — the coin still resolves H/T on the toss.
2. **Double-Side is removed** and replaced by `heads` + `tails` (core types, shop catalog, RNG, icons, tests).
3. **Face-down is a hand-visual state only.** `Face` stays `'H' | 'T'`; scoring/RNG are untouched by the face-down state. The *visual* resolver is extended to treat `face = undefined` as a face state.
4. **Per-coin display scope**: only coins *carrying* the effect get the special display; plain coins keep the current look.
5. **Composite main icon** (replaces the separate glyph + badge footer):
   - **Base** = the **highest-priority** effect's icon (the container).
   - **Left tip** = the current **face state** (H / T / face-down).
   - **Right tip** = the **resolved face** (the face it will land on): deterministic effects → that face; weighted → favored face; non-deterministic → unknown (`FaCircleQuestion`). A present `jackpot` overrides the right tip with the group icon.
   - **No effects** → just the face-state icon centered.
   - The **badge footer is removed** (no tiny icon pills under the coin).
6. **Icon library**: `react-icons` (Font Awesome 6 = `fa6`). **`lucide-react` is removed** from the whole app.
7. **75/25 coins (weight/magnetic) are kept** — no removal, no rebalance (decision reversed during the Q&A).

## Icon Mapping (approved; fa6 name adjustments noted)

The mapping was approved as-is. A few Font Awesome 6 names differ from the
fa5-style names in the approval, so the actual `fa6` exports used are listed
below (`fa6` has no `FaScale`/`FaGroup`/`FaRedo`/`FaSparkles`).

| Key | Icon (fa6) | Note |
| --- | --- | --- |
| weight | `FaScaleBalanced` | 75/25 balance (approved `FaScale` → fa6 `FaScaleBalanced`) |
| chaos | `FaShuffle` | random |
| echo | `FaRepeat` | re-toss |
| magnetic | `FaMagnet` | pulls to left neighbour |
| reverse | `FaArrowsRotate` | inverts face |
| tax | `FaDollarSign` | coin cash |
| jackpot | `FaUsers` | group (approved `FaGroup` → fa6 `FaUsers`) |
| draw | `FaRotateRight` | redraw (approved `FaRedo` → fa6 `FaRotateRight`) |
| heads | `FaCircle` | forces H |
| tails | `FaCircleDot` | forces T |
| facedown | `FaCircleQuestion` | face-down |
| face H | `FaCircle` | left tip / center |
| face T | `FaCircleDot` | left tip / center |
| face facedown | `FaCircleQuestion` | left tip / center |
| plain (no effects) | — | face-state icon centered, no extra icon |
| score (action) | `FaWandMagicSparkles` | approved `FaSparkles` → fa6 `FaWandMagicSparkles` |

All icons are wrapped with `withIcon` (`src/lib/icons.tsx`), which accepts the
legacy `strokeWidth` prop (ignored — react-icons are fill-based) so existing
consumers keep working with minimal edits.

## Contract

```ts
// core/types.ts
export type CoinEffect =
  | { kind: 'weight'; favored: Face }
  | { kind: 'heads' } | { kind: 'tails' } | { kind: 'facedown' }
  | { kind: 'chaos' } | { kind: 'echo' } | { kind: 'magnetic' } | { kind: 'reverse' }
  | { kind: 'tax' } | { kind: 'jackpot' }
  | { kind: 'draw'; count: DrawCount }
export type CoinEffectId =
  | 'weight' | 'heads' | 'tails' | 'facedown' | 'chaos' | 'echo' | 'magnetic'
  | 'reverse' | 'tax' | 'jackpot' | 'draw1' | 'draw2' | 'draw3'

// scoring.ts — odds stage: heads/tails are 100/0 toward their fixed face
// (same slot Double-Side held). facedown is NOT in the odds stage (visual only).

// coin-resolver.ts — resolveCoinFace now accepts face: Face | undefined
// (undefined = face-down) and returns the face state for the composite glyph.
```

**Odds-stage priority** (unchanged shape, Double-Side slot now Heads/Tails): magnetic (75% toward left) > **heads/tails (100/0 fixed)** > chaos (uniform) > weight (75/25) > base (50/50). Then roll, then Reverse inverts.

## Checkpoints

- [x] 18.1 `types.ts`: remove `doubleSide`; add `heads`, `tails`, `facedown` to `CoinEffect` + `CoinEffectId`; update comments.
- [x] 18.2 `scoring.ts` `resolveFace`: replace the `doubleSide` branch with `heads`/`tails` (100/0 fixed face); `facedown` is a no-op in the odds stage; update the header comment block.
- [x] 18.3 `balance.ts` `COIN_EFFECTS`: replace the Double-Side entry with Heads ($8) + Tails ($8) + Face-Down ($5); keep the 11→13 entry count note accurate.
- [x] 18.4 `shopActions.ts` `purchasedEffect`: `heads`→`{kind:'heads'}`, `tails`→`{kind:'tails'}`, `facedown`→`{kind:'facedown'}` (no favored roll); remove the `doubleSide` case.
- [x] 18.5 `descriptions.ts` `COIN_DESCRIPTIONS`: replace `doubleSide` with `heads`/`tails`/`facedown` blurbs.
- [x] 18.6 Effect modules: delete `effects/doubleSide/`; add `effects/heads/`, `effects/tails/` (config+resolver+test, 100/0 visual), `effects/facedown/` (config+resolver+test, face-down-only visual); update `effects/index.ts`.
- [x] 18.7 `coin-types.ts` + `coin-resolver.ts`: `ResolverInput.face: Face | undefined`; resolver handles face-down (base color, no H/T base color); `PRIORITY` map covers the new kinds; dispatch handles `heads`/`tails`/`facedown`.
- [x] 18.8 `lib/icons.tsx`: rebuild the icon registry on `react-icons` (`fa6`); `EFFECT_ICONS`/`FACE_ICONS`/`FACE_DOWN_ICON` per the mapping; remove the lucide imports.
- [x] 18.9 Composite glyph: rewrite `coin-glyph.tsx` to render base + left tip + right tip (highest-priority effect = base; face state = left tip; resolved face = right tip; no-effects = centered face icon); add the resolved-face helper (deterministic → face, weighted → favored, jackpot → group, else unknown).
- [x] 18.10 Remove the badge footer: drop `CoinBadges` from `coin.tsx` + `index.ts` + `coin.css`; delete `coin-badges.tsx` (+ its test) and the now-unused `components/icons/*` custom SVGs.
- [x] 18.11 Migrate all lucide consumers to `react-icons` (`menu`, `run`, `piles`, `onboarding-hint`, `save-button`, `button`, `debug`); remove the `lucide-react` dependency from `package.json`.
- [x] 18.12 Update `debug-coin.tsx` samples (Heads/Tails/Face-Down instead of DoubleSide; a face-down row).
- [x] 18.13 Update all tests referencing `doubleSide` (scoring, balance, playtest, shop, saveLoad, charms, coin-resolver, coin, coin-badges) to the new kinds.
- [x] 18.14 `tsc --noEmit`, `npm run lint`, `npm test` all green; `grep -ri "doubleSide\|lucide" src` returns zero matches.

## Exit gate

`tsc --noEmit` + `npm run lint` + `npm test` green; a Heads coin always resolves H and a Tails coin always resolves T (isolated tests); a Face-Down coin resolves H/T normally (no core change) but renders the face-down composite in hand; the composite glyph renders base + tips (verified on the `/debug/coin` page); zero `doubleSide` / `lucide` references remain.

## Status — DONE (2026-09-17)

All 14 checkpoints complete. Verification (final):

- `tsc -b` — clean (no type errors).
- `npm run lint` (eslint) — clean (no errors).
- `npm test` (vitest) — **507 passed / 507** across 46 test files.
- `npm run build` (tsc + vite) — builds successfully.
- `grep -ri "doubleSide\|lucide" src` — zero matches; `lucide-react` removed from `package.json`.
- `grep -rn "CoinBadges\|FaceBadge\|coin-badges" src` — zero matches; `coin-badges.tsx` + its test deleted; `src/components/icons/*` custom SVGs removed.

### Implementation notes (beyond the checkpoint list)

- **Composite glyph lives in `hand/coin/coin-glyph.tsx`** and is reused by every game render path: the standalone `Coin` (`coin/coin.tsx`), the hand-level `CoinDisc` (`hand/coin-disc.tsx`), and the reduced-motion `CrossfadeCoin` (`hand/toss-coin.tsx`). The 3D `FlipCoin` keeps its H-front/T-back faces (the flip animation) but drops the badge footer.
- **`CoinDisc` sizing**: effect coins use a smaller main icon (22px) so the wider composite fits the 3.5rem disc; plain coins keep 28px.
- **`withIcon` wrapper** (`src/lib/icons.tsx`): wraps each react-icons `fa6` component so it accepts the legacy `IconProps` (incl. an ignored `strokeWidth`), minimizing consumer edits during the lucide → react-icons migration.
- **fa6 name adjustments**: the approved mapping used fa5-style names that don't exist in `fa6`; the actual exports used are `FaScaleBalanced` (weight), `FaUsers` (jackpot), `FaRotateRight` (draw), `FaWandMagicSparkles` (score). See the Icon Mapping table above.
- **Face-down visual resolution**: `resolveCoinFace` accepts `face: Face | undefined`; face-down gets a brighter sunk fill + glow + dashed shell (the `facedown` effect) and the composite glyph's left tip is the face-down icon. The right tip shows the face it will land on (heads/tails → that face, weight → favored, jackpot → group, else → question mark).
- **75/25 coins (weight/magnetic) kept** — no removal, no rebalance.
