# WBS Overview: 50/50

Work Breakdown Structure for the 50/50 build. The project is decomposed into **16 sequential milestones (M0–M15)**. Each milestone is self-contained and independently testable; each checkpoint is a single, unambiguous unit of work that traces back to a locked rule in the [Scope Statement](plan_scope-statement.md) or a draft value in the [Balance Baseline](plan_balance-baseline.md).

**Execution rule:** complete checkpoints **in order** within a milestone, and complete milestones **in order** (M0 → M15). Do not start a milestone until every checkpoint in the milestones it depends on is done and its exit gate passes. Dependencies are listed at the top of each milestone file.

> **Status:** M0–M11 **Done** (plus the pre-M12 NASA quality gate); M12 in progress (12.1–12.4 done). Checkboxes are checked off in each plan doc as checkpoints land; live status is tracked in [Direct & Manage Project Work](../execute/execute_work_management.md).

## Build Conventions (read first)

These apply to every milestone. **The [SDD](../../sdd/software_design_architechture.md) is the source of truth** for types, module layout, and function signatures — this WBS follows it. A checkpoint is **done** only when `tsc --noEmit`, `npm run lint`, and the relevant tests are all green.

- **Commands:** `npm run dev`, `npm run build`, `npm test` (vitest), `npm run lint` (ESLint), `tsc --noEmit`. Run one test file with `npx vitest run <path>`.
- **Module map** (from [SDD Component Design](../../sdd/software_design_component.md)):
  - `src/core/` — pure, no React/store/DOM: `types.ts`, `rng.ts` (C1), `balance.ts` (C2, data-only), `scoring.ts` (C3: `resolveFace` / `matchTier` / `scoreHand`), `deck.ts` (C11: collection build/shuffle/draw/discard/return).
  - `src/state/runStore.ts` — the single zustand store (C4): the hand-phase machine, shop actions, and save/resume all live here.
  - `src/pages/` — screens (menu, run, shop, run-end, C5–C9); `src/components/` — game components + juice (C7, C10); `src/lib/` — small UI helpers.
- **Types:** every shared type is defined once in `src/core/types.ts` (M1), exactly as in [SDD Data Design](../../sdd/software_design_data.md) — never re-declared. Face is `type Face = 'H' | 'T'`; a tossed coin's face lives on `Slot.face`, not on the coin.
- **Tunable values** (tier chips/mult, blind targets/rewards, boss effects, deck size, prices, odds) live **only** in `src/core/balance.ts`, which mirrors [balance-baseline](plan_balance-baseline.md) — the source of truth. Reference them by their SDD name (`TIERS`, `BLINDS`, `BOSS_RULES`, `CHARMS`, `COIN_EFFECTS`, and the constants `HAND_SIZE`, `PLAY_SIZE`, `HANDS_PER_BLIND`, `BASE_DECK_SIZE`, …); **never hardcode a copy** of a number in engine or test code.
- **Coin convention:** `Face` is `'H'` (Heads = **win**) or `'T'` (Tails = loss). A coin in the hand is face-down until tossed (`Hand` holds `Coin | null`); the resolved face is set on its `Slot` in the toss phase.
- **Purity:** `src/core/` functions are pure — inputs in, new values out; never mutate arguments, never touch `localStorage`/`Date`/DOM. Orchestration and the only `localStorage` access live in the store.
- **Randomness:** all randomness goes through the single seeded `Rng` (C1, one instance per run) in the fixed **draw-order contract** ([SDD Data Design](../../sdd/software_design_data.md)). `Math.random()` is **banned** in `src/core/` and `src/state/` (M14 grep check). Determinism rule: same seed + same action sequence ⇒ identical run (uninterrupted; see the resume note in Data Design).
- **Test placement:** tests are colocated as `<module>.test.ts` beside the module they cover.

## Milestone Index

| # | Milestone | Depends on | File |
| --- | --- | --- | --- |
| M0 | Project Setup & Tooling | — | [plan_wbs-m0-setup.md](plan_wbs-m0-setup.md) |
| M1 | Core Data Types | M0 | [plan_wbs-m1-data-types.md](plan_wbs-m1-data-types.md) |
| M2 | Seeded RNG | M0 | [plan_wbs-m2-rng.md](plan_wbs-m2-rng.md) |
| M3 | Deck & Draw Pile | M1, M2 | [plan_wbs-m3-deck.md](plan_wbs-m3-deck.md) |
| M4 | Hand Phase State Machine | M1, M3 | [plan_wbs-m4-hand-phase.md](plan_wbs-m4-hand-phase.md) |
| M5 | Pattern / Tier Matching | M1 | [plan_wbs-m5-tier-matching.md](plan_wbs-m5-tier-matching.md) |
| M6 | Scoring Pipeline | M5 | [plan_wbs-m6-scoring.md](plan_wbs-m6-scoring.md) |
| M7 | Coin Effects (v1 core set of 9) | M4, M6 | [plan_wbs-m7-coin-effects.md](plan_wbs-m7-coin-effects.md) |
| M8 | Charms | M6 | [plan_wbs-m8-charms.md](plan_wbs-m8-charms.md) |
| M9 | Shop | M7, M8 | [plan_wbs-m9-shop.md](plan_wbs-m9-shop.md) |
| M10 | Blind / Round / Boss Progression | M4, M6 | [plan_wbs-m10-progression.md](plan_wbs-m10-progression.md) |
| M11 | Save / Load | M10 | [plan_wbs-m11-save-load.md](plan_wbs-m11-save-load.md) |
| M12 | UI Screens | M1–M11 | [plan_wbs-m12-ui.md](plan_wbs-m12-ui.md) |
| M13 | Juice (Animation & SFX) | M12 | [plan_wbs-m13-juice.md](plan_wbs-m13-juice.md) |
| M14 | Test Suite Completion | M2–M11 | [plan_wbs-m14-tests.md](plan_wbs-m14-tests.md) |
| M15 | README & Final Packaging | M12, M14 | [plan_wbs-m15-readme.md](plan_wbs-m15-readme.md) |

## Tree

```
50/50
├── M0  Project Setup & Tooling      — scaffold, tooling, folders, dev/build/test green
├── M1  Core Data Types              — Coin, CoinEffect(×9), Charm(×5), Tier(×6), HandPhase, RunState, BossRule, ShopOffer
├── M2  Seeded RNG                   — createRng(seed), generateSeed(), determinism tests
├── M3  Deck & Draw Pile            — deck.ts: build/shuffle/draw/discard/return (finite per blind)
├── M4  Hand Phase State Machine     — Draw → Play → Toss → Buff → Score reducer
├── M5  Pattern / Tier Matching      — matchTier(play, boss) → highest of 6 tiers | null
├── M6  Scoring Pipeline             — tier → base → boosters → total → coin cash
├── M7  Coin Effects (9)             — face / cash / draw-enchant / Echo / merge
├── M8  Charms (5)                   — pool, ownership, left-to-right order
├── M9  Shop                         — 5 offers, 1 free reroll, merge, remove, hand-size upgrade
├── M10 Blind / Round / Boss         — 4 rounds × 3 blinds, targets, 4 boss rules
├── M11 Save / Load                  — manual localStorage, resume at blind start
├── M12 UI Screens                   — menu, run (draw/play/toss/buff/score), shop, game over
├── M13 Juice                        — flip animation, ticker, confetti, SFX (no music)
├── M14 Test Suite Completion        — full vitest green, determinism + boundary sweeps
└── M15 README & Final Packaging     — install/run/seed docs, final audits, ship
```

## Traceability to Charter Objectives

Every milestone maps to at least one [Charter](../init/init_project_charter.md) §2 objective.

| Charter objective | Milestones |
| --- | --- |
| 1 — Complete 1-hour run | M3, M9, M10, M12, M15 |
| 2 — Core loop fun & clear | M3, M4, M5, M6, M7, M8, M9, M12, M13 |
| 3 — Reproducible, shareable runs | M2, M15 |
| 4 — Persistence (save/resume) | M11 |
| 5 — Core logic tested | M1, M2, M5, M6, M14 |
| 6 — Ship on schedule | M0, M15 (all milestones roll up here) |

## Mapping to Charter Key Milestones & Quality Gates

The [Charter](../init/init_project_charter.md) §6 fixes four dated key milestones and the [Quality Gates](plan_quality-gates.md) are keyed to them. The M0–M15 build milestones roll up as follows (gate = the gate that must pass to exit the charter milestone):

| Charter milestone (date) | Build milestones (M0–M15) | Gate to exit |
| --- | --- | --- |
| M1 — Scaffold (2026-09-19) | M0, M1 | tsc + ESLint + Prettier clean; vitest green |
| M2 — Vertical slice (2026-09-22) | M2, M3, M4, M5, M6 | vitest green (RNG + scoring); playtest 5/5 (1 blind playable) |
| M3 — Full 12-blind run (2026-09-26) | M7, M8, M9, M10, M11, M12 | vitest green (state); playtest 5/5; balance target |
| M4 — Polish & done (2026-10-03) | M13, M14, M15 | all gates: 60fps, balance, full suite green |

The frozen charter dates and the Quality Gates table are unchanged; this mapping is how the finer M0–M15 breakdown reports up to them.
