# M22 — Pattern (Tier) Upgrades in the Shop

**Depends:** M6 (scoring), M9 (shop), M13 (UI), M21 (config registry) · **Files:** `src/core/types.ts` (`ShopOffer` + `RunState`), `src/core/balance.ts` (`TIER_UPGRADE_*`), `src/core/scoring/scoring.ts` (`tierScore`), `src/state/shop/shop-offers.ts` (`generateOffers` + `sameOffer`), `src/state/shop/shopActions.ts` (`buyDraft`), `src/state/runStore.ts` (initial `tierUpgrades` + score wiring), `src/state/saveActions.ts` (save version 3→4), `src/components/shop/offer/offer-grid.tsx` (the `tierUpgrade` tile), `src/components/wiki/tabs/patterns-tab.tsx` (upgraded values), `src/components/hand/score-ticker/score-ticker.tsx` (verify the upgraded banner), a new run tier-reference panel · **Source of truth:** [SDD Data Design](../../sdd/software_design_data.md) Run State + Shop; [Balance Baseline](plan_balance-baseline.md) → Pattern Upgrades · Conventions: [overview](plan_wbs-overview.md).

*Goal: make the scoring patterns (tiers — Jackpot, Alternating, 4-in-a-row, 4-same, Triple-run, 3-same) upgradable in the shop, like Balatro's Jokers. The player buys a "pattern upgrade" that boosts ONE tier's chips or mult; the upgrade persists for the whole run and is shown everywhere the tier's numbers appear.*

## Design Decisions (Q&A 2026-09-19)

Locked by the question round; these are the M22 defaults.

1. **Per-tier offers** — each pattern upgrade targets ONE tier (e.g. "+10 chips to Jackpot" or "+1 mult to Alternating"). Buying the same tier again stacks (no cap — a committed build can pump one pattern hard).
2. **Fixed cost + fixed value** — every upgrade of a tier costs the same ($8) and adds the same amount (+10 chips or +1 mult). No per-level scaling (kept deliberately simple; the stack itself is the snowball).
3. **Whole run, shown everywhere** — upgrades persist across blinds and shops (like charms, not per-blind), and appear in the tier banner (the `chips × mult = total`), the wiki patterns tab, and a tier reference on the run screen.

## Balance (draft — tunable in playtest)

| Upgrade | Effect | Cost |
| --- | --- | --- |
| +Chips (per tier) | +10 chips to that tier | $8 |
| +Mult (per tier) | +1 mult to that tier | $8 |

Impact: a +10-chips upgrade is worth +10 × (the tier's effective mult); a +1-mult upgrade is worth +1 × (the tier's effective chips). On a base tier both land in the +10…+50 total range (e.g. +10 chips on Jackpot = +40; +1 mult on Jackpot = +50), so the two are comparable in value. Upgrades apply **before** the charm boosters, so a `+Mult` charm multiplies the upgraded chips too (the usual Balatro-style compounding).

## Contract

```ts
// core/types.ts
export type TierUpgradeStat = 'chips' | 'mult'
export interface TierUpgrade { tier: TierId; stat: TierUpgradeStat }
export type ShopOffer =
  | { kind: 'charm'; charm: CharmId }
  | { kind: 'coin'; effect: CoinEffectId }
  | { kind: 'handSize' }
  | { kind: 'tierUpgrade'; upgrade: TierUpgrade }

// RunState — the player's purchased tier upgrades (whole run; like charms).
// All six tiers start at { chips: 0, mult: 0 }.
interface RunState {
  ...
  tierUpgrades: Record<TierId, { chips: number; mult: number }>
}

// core/balance.ts
export const TIER_UPGRADE_CHIPS = 10   // +10 chips per chips upgrade
export const TIER_UPGRADE_MULT = 1     // +1 mult per mult upgrade
export const TIER_UPGRADE_PRICE = 8    // cost per upgrade (chips or mult)

// scoring.ts — tierScore takes tierUpgrades and applies the matched tier's
// upgrades AFTER the base, BEFORE the charm boosters (so boosters compound):
function tierScore(play, boss, charms, tierUpgrades) {
  ...
  let chips = base?.chips ?? 0
  let mult  = base?.mult  ?? 0
  if (tier) { chips += tierUpgrades[tier].chips; mult += tierUpgrades[tier].mult }  // 2.5
  // 3. boosters (plusChips / plusMult / jackpotFever) — unchanged
  const total = tier ? chips * mult : 0
}

// shop-offers.ts — generateOffers adds the 12 tier upgrades (6 tiers × chips/mult)
// to the pool (the pool grows 18 → 30; the shop still draws 5 without replacement).
// sameOffer handles the 'tierUpgrade' variant (tier + stat must match).

// shopActions.ts — buyDraft handles the 'tierUpgrade' offer:
//   price = TIER_UPGRADE_PRICE; no owned/cap reject;
//   st.tierUpgrades[upgrade.tier][upgrade.stat] += (chips ? TIER_UPGRADE_CHIPS : TIER_UPGRADE_MULT)
```

**Scoring order (M6, extended):** 1. Tier → 2. Base (TIERS) → **2.5. Tier upgrades (this tier's purchased chips/mult)** → 3. Boosters (charms) → 4. Total (chips × mult) → 5. Coin cash. The projection (`projectScore`) uses the same pipeline, so the live toss projection and the real score agree exactly (M13 §0).

## Checkpoints

- [x] 22.1 `types.ts`: add `TierUpgradeStat`, `TierUpgrade`, the `tierUpgrade` `ShopOffer` variant, and `tierUpgrades` to `RunState`.
- [x] 22.2 `balance.ts`: add `TIER_UPGRADE_CHIPS` (10), `TIER_UPGRADE_MULT` (1), `TIER_UPGRADE_PRICE` (8).
- [x] 22.3 `scoring.ts`: `tierScore` takes `tierUpgrades` and applies the matched tier's upgrades after the base, before the boosters; `scoreHand` + `projectScore` pass it through.
- [x] 22.4 `shop-offers.ts`: `generateOffers` adds the 12 tier upgrades (6 tiers × chips/mult) to the pool; `sameOffer` handles the `tierUpgrade` variant.
- [x] 22.5 `shopActions.ts` `buyDraft`: handle the `tierUpgrade` offer (price = `TIER_UPGRADE_PRICE`; apply the upgrade to `st.tierUpgrades`).
- [x] 22.6 `runStore.ts`: initialize `tierUpgrades` (all six tiers at `{ chips: 0, mult: 0 }`); thread `tierUpgrades` into the `score`/`projectScore` call sites.
- [x] 22.7 `saveActions.ts`: bump `SAVE_VERSION` 3 → 4; the load migrates a v3 save (missing `tierUpgrades` → all six tiers at zero).
- [x] 22.8 `offer-grid.tsx`: render the `tierUpgrade` tile — category badge "Pattern", the tier's icon, a "+10 chips" / "+1 mult" title naming the tier, the price, the Buy button; hover → the detail row.
- [x] 22.9 `patterns-tab.tsx` (wiki): show each tier's **effective** chips/mult (base + upgrades) with the upgrade amount noted (e.g. "50 → 60 (+10)"), falling back to the base when no upgrade is owned.
- [x] 22.10 `score-ticker.tsx`: the banner reads chips/mult from the `Score` (auto-updated by 22.3) — verify the upgraded numbers render; no structural change expected.
- [x] 22.11 Run tier reference: a compact panel on the run screen listing each tier's current `chips × mult` (base + upgrade), so the player sees their investment at a glance (reduced-motion safe, no raw px spacing).
- [x] 22.12 Tests: scoring (a +10-chips / +1-mult upgrade changes the tier total; boosters compound on top), shop (a `tierUpgrade` offer is generated and bought; `sameOffer`), save/load (a v3 save loads with all upgrades zero), UI (the tile renders; the wiki shows the upgraded values).
- [x] 22.13 Gate: `tsc` + `eslint` + `check-structure` + `vitest` + `vite build` all green.

## Exit gate

`tsc` + `eslint` + `check-structure` + `vitest` + `vite build` all green; buying "+10 chips to Jackpot" makes a Jackpot hand score 60×4 (240) instead of 50×4 (200); buying "+1 mult to Alternating" makes an Alternating hand score 45×5 (225) instead of 45×4 (180); the upgrades persist across blinds and shops and show in the tier banner, the wiki patterns tab, and the run tier reference; a pre-M22 (v3) save loads with every tier upgrade at zero.

## Status — DONE (2026-09-19)

Implemented. All checkpoints 22.1–22.13 complete; `tsc` + `eslint` +
`check-structure` + `vitest` (632 tests) + `vite build` all green.

Implementation notes (deviations from the contract, all deliberate):
- `scoreHand` / `projectScore` take `tierUpgrades` as a TRAILING OPTIONAL
  parameter (default `zeroTierUpgrades()`) instead of a required one — the
  ~60 existing call sites (mostly tests) keep working unchanged; the real
  call sites (hand-score, use-toss-landing) pass it through explicitly.
- `matchTier` was split out of `scoring.ts` into `match-tier.ts` (the
  150-LOC file rule — M22's step 2.5 pushed `scoring.ts` over the limit).
- The run tier reference lives in `src/components/run/tier-reference/`
  (new folder — `components/run` was at the 5-file cap) as a "tiers" grid
  row between the charm bar and the hand; upgraded tiers are tinted with
  their tier color, static (reduced-motion safe).
