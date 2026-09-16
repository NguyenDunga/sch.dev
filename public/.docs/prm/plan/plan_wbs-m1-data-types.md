# M1 — Core Data Types

**Depends:** M0 · **File:** `src/core/types.ts` · **Source of truth:** [SDD Data Design](../../sdd/software_design_data.md) → Core Types + Run State · Conventions: [overview](plan_wbs-overview.md).

*Goal: define every shared shape once, exactly as the SDD Data Design lists them. Types only — no logic, no defaults. Every later milestone imports from here.*

Implement the full type block from **[SDD Data Design → Core Types](../../sdd/software_design_data.md)** verbatim (it is the authority — do not restate or vary it here). Checkpoints below are that block, item by item.

## Checkpoints

- [x] 1.1 Primitives/unions: `Face`, `CoinEffectId` (11 ids: 8 + draw1/2/3), `TierId` (6), `BlindKind`, `Phase`, `HandPhase` (5), `BossRuleId` (4), `CharmId` (5), `CharmCategory` (4).
- [x] 1.2 `Coin { id: number; effects: CoinEffectId[]; faceParams?: { weight?: Face; doubleSide?: Face } }` — face is **not** on the coin (see 1.3); `faceParams` is per-effect so a merged coin can hold both Weight and Double-Side faces.
- [x] 1.3 `Slot { coin; face: Face; echoUsed }`, `Hand = (Coin|null)[]`, `Play = (Slot|null)[]` (length 5; `null` = empty = nothing).
- [x] 1.4 `ShopOffer` discriminated union (`charm | coin | handSize`).
- [x] 1.5 Record interfaces: `Tier`, `Blind`, `CharmDef`, `CoinDef`, `Deck`, `Score`.
- [x] 1.6 `RunState` — every field from the SDD Run State block (seed, phase, round, blindIndex, hand, play, handPhase, handSize, handsLeft, blindScore, cash, charms, deck, shop, lastScore, runScore, won, rngState).
- [x] 1.7 All exported from one `types.ts`; no runtime logic, no defaults.
- [x] 1.8 `tsc --noEmit` clean.

## Exit gate

`tsc --noEmit` clean; `types.ts` matches the SDD block field-for-field; member counts exact (11 effect ids / 6 tiers / 5 charms / 4 boss rules / 5 hand phases); no runtime code.
