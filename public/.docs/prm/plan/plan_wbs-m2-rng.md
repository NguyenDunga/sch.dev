# M2 — Seeded RNG

**Depends:** M0 · **Files:** `src/core/rng.ts` (+`.test.ts`) · **Source:** [Charter](../init/init_project_charter.md) §2 obj 3 · Conventions: [overview](plan_wbs-overview.md).

*Goal: the single source of all randomness. Deterministic from a seed — verify before anything depends on it.*

## Contract

```ts
export interface Rng {
  nextInt(min: number, max: number): number;   // uniform, inclusive [min,max]
  nextBool(probability: number): boolean;        // true with probability (0..1)
}
export function createRng(seed: string): Rng;     // hash seed -> pure-rand generator
export function generateSeed(): string;           // 6–8 char [A-Za-z0-9]
```

Two `Rng`s from the same seed produce identical sequences.

## Checkpoints

- [ ] 2.1 `createRng(seed)` → `{ nextInt, nextBool }`.
- [ ] 2.2 `generateSeed()` matches `/^[A-Za-z0-9]{6,8}$/`.
- [ ] 2.3 Determinism test: same seed → deep-equal sequences (100 draws).
- [ ] 2.4 Different seeds → sequences differ.
- [ ] 2.5 `nextBool(0.25)` over 10,000 calls lands within ±3% of 0.25.

## Exit gate

`npx vitest run src/core/rng.test.ts` green; determinism test (2.3) exact. (Charter M2: RNG green.)
