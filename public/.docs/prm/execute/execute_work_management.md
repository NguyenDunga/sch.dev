# Direct & Manage Project Work: 50/50
| Field | Value |
| --- | --- |
| **Project ID** | PRJ-2026-001 |
| **Document** | Direct & Manage Project Work |
| **Version** | 1.0 |
| **Date** | 2026-09-12 |
| **Owner** | BlueCloud (PM) |
This is the execution playbook for producing the 50/50 deliverables. It operationalizes the [Scope Management Plan](../plan/plan_scope_management.md) and the [WBS Overview](../plan/plan_wbs-overview.md) — the *what* is defined there; this file defines *how the work gets done and tracked* during execution.

## Execution Approach

- **Solo dev loop.** One developer (BlueCloud) executes all work. The loop per work package: implement → `tsc` + `npm run lint` → `npm run test` → `npm run dev` (playtest) → commit.
- **Milestone sequencing.** Work is executed in WBS order: M1 → M2 → M3 → M4. A milestone is not started until the prior milestone's exit gates pass ([Quality Gates](../plan/plan_quality-gates.md)).
- **Slice-first.** M2 is a playable vertical slice — the earliest point the core loop is testable. De-risk before building out.

## Work Package Tracking

Component-level tracking, one table per milestone. "Done means" is copied from the [WBS](../plan/plan_wbs-overview.md) — a work package is `Done` only when its Done-means is met. Update Status as work is performed.

### M1 — Scaffold

| ID | Component | Done means | Status | Completed | Notes |
| --- | --- | --- | --- | --- | --- |
| 1.1 | Project scaffold | Vite + React + TS; Tailwind + shadcn/ui installed, rendering a test page | Done | 2026-09-12 | Vite 8 + React 19 + TS 6 at repo root (absorbed existing package.json, kept `qwen` script); Tailwind v4 + shadcn/ui (Base UI, Nova preset) — test page renders (headless DOM check) |
| 1.2 | State store | zustand + immer + persist wired; a dummy store persists across reload | Done | 2026-09-12 | `runStore.ts` dummy counter, key `fifty-fifty-run`; rehydrate round-trip unit-tested; browser persistence verified by wiring (standard zustand localStorage) |
| 1.3 | Seeded RNG | pure-rand wrapper `createRng(seed)` → `next()`; same seed → same sequence (unit-tested) | Done | 2026-09-12 | xmur3 (vendored) → xoroshiro128plus (pure-rand v8); 6 unit tests; SDD RNG contract corrected (see arch change log) |
| 1.4 | Tests + scripts | vitest running (`npm test`); npm scripts: dev / build / test | Done | 2026-09-12 | vitest 4, 8/8 green; scripts dev/build/test/lint + qwen |

### M2 — Vertical Slice

| ID | Component | Done means | Status | Completed | Notes |
| --- | --- | --- | --- | --- | --- |
| 2.1 | Core scoring | Pure functions: toss 5 coins (seeded), 6-tier pattern detection, chips×mult; unit tests for all 6 tiers + highest-value-wins | Done | 2026-09-12 | Commit 9c1803f; 6-tier scoring + 12-blind/boss/balance tables; exhaustive 32-hand test pins EV 58.44 |
| 2.2 | Hand UI | Hand area showing 5 coins; toss animation; chips×mult ticker | Done | 2026-09-13 | Commit ac50dc3; hand area + toss animation + ticker; minimal store (full C4 state machine lands in M2.3/M3) |
| 2.3 | Blind loop | 1 blind with target (draft: 300), 10 hands, win → next / miss → game over | Not started | | |
| 2.4 | Playtest pass | 10-min playtest: pattern scoring + loop feel fun and clear; notes logged, tuning applied | Not started | | |

### M3 — Full 12-Blind Run

| ID | Component | Done means | Status | Completed | Notes |
| --- | --- | --- | --- | --- | --- |
| 3.1 | Run structure | 12 blinds, small/big/boss per round, escalating targets; round transitions | Not started | | |
| 3.2 | Boss blinds | 4 fixed rules (No Alternating / Short Fuse / No Jackpots / Heavy Target) active on boss blinds | Not started | | |
| 3.3 | Charms | 5-charm pool with effects; left-to-right order matters in scoring; drag-to-reorder | Not started | | |
| 3.4 | Shop | 5 offers (no duplicates of owned) + 1 free reroll between blinds; blind rewards only; cash tracked | Not started | | |
| 3.5 | Game over | Run ends on failed blind; score summary screen with seed | Not started | | |
| 3.6 | Piggy ceramic deck | Hand is 5 coins drawn from the deck (tossed one at a time); re-toss (discard + draw) limited per hand (+1 with Re-Toss charm); deck refilled/reshuffled each blind; no discard pile | Not started | | |

### M4 — Polish & Done

| ID | Component | Done means | Status | Completed | Notes |
| --- | --- | --- | --- | --- | --- |
| 4.1 | Seeded runs | Short-string seed (6–8 chars) on menu; entering a seed → identical run; reproducibility verified by tests | Not started | | |
| 4.2 | Save/resume | Manual save to localStorage; resume verified across sessions (close → reopen → continue) | Not started | | |
| 4.3 | Juice | Coin-toss animation, chips×mult ticker, confetti on blind clear, SFX (toss, win/lose) — no music | Not started | | |
| 4.4 | Tests green | vitest suite (scoring + RNG) 100% passing | Not started | | |
| 4.5 | Delivery | `npm run build` works locally; README (run + enter/share seeds); final playtest of a full run | Not started | | |

## Deliverables Produced

Each milestone produces the deliverables named in the [Scope Statement](../plan/plan_scope-statement.md). Record actual production here.

| Deliverable | Milestone | Produced | Verified | Notes |
| --- | --- | --- | --- | --- |
| Local web build (full 12-blind run) | M4 | | | |
| Source code (Vite + React + TS) | M1–M4 | | | |
| vitest suite (scoring + RNG) | M1–M4 | | | |
| README (run + seed sharing) | M4 | | | |
