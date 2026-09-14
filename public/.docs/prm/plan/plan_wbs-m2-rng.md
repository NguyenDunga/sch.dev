# M2 — Seeded RNG

**Depends:** M0 · **Files:** `src/core/rng.ts` (+`.test.ts`) · **Source of truth:** [SDD Component Design](../../sdd/software_design_component.md) C1; [SDD Data Design](../../sdd/software_design_data.md) → RNG Contract · Conventions: [overview](plan_wbs-overview.md).

*Goal: the single source of all randomness, one instance per run, serializable for save/resume. Deterministic from a seed — verify before anything depends on it.*

## Contract (SDD C1)

```ts
interface Rng {
  next(): number            // [0, 1)
  state(): number[]         // serialize (xoroshiro128plus state)
  restore(s: number[]): void
}
export function createRng(seed: string): Rng     // xmur3 hash of seed -> xoroshiro128plus (pure-rand)
export function generateSeed(): string           // 6–8 char [A-Za-z0-9], for the menu's random-seed button
```

Derive helpers from `next()` as needed (int in a range, boolean at probability p) — do not add a second RNG. Same seed → identical `next()` sequence.

## Checkpoints

- [ ] 2.1 `createRng(seed)` → `{ next, state, restore }`, seeded via the vendored `xmur3` hash → `xoroshiro128plus`.
- [ ] 2.2 `generateSeed()` matches `/^[A-Za-z0-9]{6,8}$/`.
- [ ] 2.3 Determinism test: two `Rng`s from the same seed → deep-equal sequences (100 `next()` calls).
- [ ] 2.4 Different seeds → sequences differ.
- [ ] 2.5 `state()` / `restore()` round-trip: capture `state()` mid-sequence, `restore()` into a new `Rng`, and the continuations match (this backs save/resume).
- [ ] 2.6 A boolean helper at p=0.25 over 10,000 draws lands within ±3% of 0.25 (sanity for Jackpot cash).

## Exit gate

`npx vitest run src/core/rng.test.ts` green; determinism (2.3) and state/restore round-trip (2.5) exact. (Charter M2: RNG green.)
