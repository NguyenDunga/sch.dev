# Direct & Manage Project Work: 50/50
| Field | Value |
| --- | --- |
| **Project ID** | PRJ-2026-001 |
| **Document** | Direct & Manage Project Work |
| **Version** | 2.0 |
| **Date** | 2026-09-14 |
| **Owner** | BlueCloud (PM) |

This is the execution playbook for producing the 50/50 deliverables. It operationalizes the [Scope Management Plan](../plan/plan_scope_management.md) and the [WBS Overview](../plan/plan_wbs-overview.md) — the *what* is defined there; this file defines *how the work gets done and tracked* during execution.

> **v2.0 (2026-09-14):** re-based onto the M0–M15 milestone system (was the 4-milestone M1–M4 WBS). All checkpoint status is **reset to Not started** — see [WBS Overview](../plan/plan_wbs-overview.md) for the milestone-to-charter mapping.

## Execution Approach

- **Solo dev loop.** One developer (BlueCloud) executes all work. The loop per checkpoint: implement → `tsc` + `npm run lint` → `npm run test` → `npm run dev` (playtest where relevant) → commit.
- **Milestone sequencing.** Work is executed in WBS order: M0 → M1 → … → M15. A milestone is not started until every checkpoint in the milestones it depends on is done and its exit gate passes ([Quality Gates](../plan/plan_quality-gates.md), keyed to the charter milestones via the mapping in the [WBS Overview](../plan/plan_wbs-overview.md)). Dependencies are listed at the top of each milestone file.
- **Engine-first.** The engine (M1–M11) is built and unit-tested before the UI (M12), so the UI is a thin layer over a proven engine. The earliest playable slice is the charter M2 milestone (build M2–M6).

## Work Package Tracking

One row per checkpoint, grouped by milestone. A checkpoint is `Done` only when its item in the milestone file is satisfied and the milestone exit gate is green. Update **Status** (Not started / In progress / Done) and **Completed** (date) as work is performed.

### M0 — Project Setup & Tooling → [wbs](../plan/plan_wbs-m0-setup.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 0.1 Vite + React + TS scaffold | Not started | | |
| 0.2 Tailwind CSS | Not started | | |
| 0.3 shadcn/ui (base) | Not started | | |
| 0.4 @dnd-kit/sortable + core | Not started | | |
| 0.5 pure-rand | Not started | | |
| 0.6 vitest + testing-library, `npm run test` | Not started | | |
| 0.7 Folder tree (core/state/components/pages/lib) | Not started | | |
| 0.8 `npm run dev` renders | Not started | | |
| 0.9 `npm run build` works | Not started | | |
| 0.10 `npm run test` runs clean | Not started | | |

### M1 — Core Data Types → [wbs](../plan/plan_wbs-m1-data-types.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 1.1 `Coin` | Not started | | |
| 1.2 `CoinEffect` (9 variants) | Not started | | |
| 1.3 `Charm` (pool of 5) | Not started | | |
| 1.4 `Tier` (6 tiers + minCoins) | Not started | | |
| 1.5 `HandPhase` | Not started | | |
| 1.6 `RunState` | Not started | | |
| 1.7 `BossRule` | Not started | | |
| 1.8 `ShopOffer` | Not started | | |
| 1.9 Export from `types.ts` | Not started | | |
| 1.10 `tsc --noEmit` clean | Not started | | |

### M2 — Seeded RNG → [wbs](../plan/plan_wbs-m2-rng.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 2.1 `createRng(seed)` | Not started | | |
| 2.2 `generateSeed()` | Not started | | |
| 2.3 Determinism test | Not started | | |
| 2.4 Different-seed test | Not started | | |
| 2.5 `nextBool(0.25)` band test | Not started | | |

### M3 — Deck & Draw Pile → [wbs](../plan/plan_wbs-m3-deck.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 3.1 `createBaseDeck()` (80) | Not started | | |
| 3.2 `shuffleIntoDrawPile` | Not started | | |
| 3.3 `drawCoins` (shrink on short) | Not started | | |
| 3.4 `discardCoins` | Not started | | |
| 3.5 Over-draw test | Not started | | |
| 3.6 No mid-blind reshuffle test | Not started | | |
| 3.7 Blind-start reset test | Not started | | |

### M4 — Hand Phase State Machine → [wbs](../plan/plan_wbs-m4-hand-phase.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 4.1 `advancePhase` reducer | Not started | | |
| 4.2 Draw phase | Not started | | |
| 4.3 Play: `selectCoinsToPlay` (1–5) | Not started | | |
| 4.4 Play: `discardFromHand` (draw-enchant) | Not started | | |
| 4.5 Play: `confirmPlay` | Not started | | |
| 4.6 Toss phase | Not started | | |
| 4.7 Buff: `reflipEcho` | Not started | | |
| 4.8 Buff: `confirmBuff` | Not started | | |
| 4.9 Score: `confirmScore` | Not started | | |
| 4.10 Out-of-phase no-op test | Not started | | |
| 4.11 Full-cycle test | Not started | | |
| 4.12 Discard-after-score test | Not started | | |

### M5 — Pattern / Tier Matching → [wbs](../plan/plan_wbs-m5-tier-matching.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 5.1 `matchTier` | Not started | | |
| 5.2 3-same | Not started | | |
| 5.3 4-same | Not started | | |
| 5.4 5-same / Jackpot | Not started | | |
| 5.5 4-in-a-row | Not started | | |
| 5.6 Alternating | Not started | | |
| 5.7 Triple-run | Not started | | |
| 5.8 Priority resolution | Not started | | |
| 5.9 ≤2-coin → null | Not started | | |
| 5.10 One test per tier | Not started | | |
| 5.11 2-coin → null test | Not started | | |
| 5.12 Priority test | Not started | | |

### M6 — Scoring Pipeline → [wbs](../plan/plan_wbs-m6-scoring.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 6.1 Tier step (+ boss modifier) | Not started | | |
| 6.2 Base step | Not started | | |
| 6.3 Boosters step (left-to-right) | Not started | | |
| 6.4 Score step | Not started | | |
| 6.5 Coin cash step | Not started | | |
| 6.6 Charm-order test | Not started | | |
| 6.7 No-charm test | Not started | | |
| 6.8 Deterministic Tax test | Not started | | |
| 6.9 Reproducible Jackpot cash test | Not started | | |
| 6.10 Null-tier zero-score test | Not started | | |

### M7 — Coin Effects (9) → [wbs](../plan/plan_wbs-m7-coin-effects.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 7.1 List the 9 (comment block) | Not started | | |
| 7.2 Face effects | Not started | | |
| 7.3 Cash effects (Tax/Jackpot) | Not started | | |
| 7.4 Draw-enchant | Not started | | |
| 7.5 Echo | Not started | | |
| 7.6 Shop merge (stack effects) | Not started | | |
| 7.7 9 isolated tests | Not started | | |
| 7.8 Merged-effect test | Not started | | |
| 7.9 No out-of-scope effects | Not started | | |

### M8 — Charms → [wbs](../plan/plan_wbs-m8-charms.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 8.1 5-charm pool | Not started | | |
| 8.2 `ownedCharms` ordered array | Not started | | |
| 8.3 `reorderCharms` | Not started | | |
| 8.4 No-duplicates rule | Not started | | |
| 8.5 Removed charms absent | Not started | | |
| 8.6 Reorder-affects-scoring test | Not started | | |

### M9 — Shop → [wbs](../plan/plan_wbs-m9-shop.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 9.1 `generateShopOffers` | Not started | | |
| 9.2 `rerollShop` (1 free) | Not started | | |
| 9.3 `buyOffer` | Not started | | |
| 9.4 `mergeCoins` | Not started | | |
| 9.5 `removeCoin` ($1 delete) | Not started | | |
| 9.6 Hand-size upgrade | Not started | | |
| 9.7 Reroll-once test | Not started | | |
| 9.8 Duplicate-charm-rejected test | Not started | | |
| 9.9 Remove-costs-$1 test | Not started | | |
| 9.10 No sell-charm test | Not started | | |

### M10 — Blind / Round / Boss Progression → [wbs](../plan/plan_wbs-m10-progression.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 10.1 `getBlindTarget` | Not started | | |
| 10.2 `getBossRule` (4 fixed) | Not started | | |
| 10.3 Blind-start setup | Not started | | |
| 10.4 Blind-end check | Not started | | |
| 10.5 Run completion | Not started | | |
| 10.6 Boss-rule-scope test | Not started | | |
| 10.7 Game-over test | Not started | | |
| 10.8 Full-progression test | Not started | | |

### M11 — Save / Load → [wbs](../plan/plan_wbs-m11-save-load.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 11.1 `saveRun` (manual only) | Not started | | |
| 11.2 `loadRun` | Not started | | |
| 11.3 Resume at blind start | Not started | | |
| 11.4 Save round-trip test | Not started | | |
| 11.5 No-autosave test | Not started | | |

### M12 — UI Screens → [wbs](../plan/plan_wbs-m12-ui.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 12.1 Menu screen | Not started | | |
| 12.2 Run — Draw/Play | Not started | | |
| 12.3 Run — Toss/Buff | Not started | | |
| 12.4 Run — Score | Not started | | |
| 12.5 Shop screen | Not started | | |
| 12.6 Game Over screen | Not started | | |
| 12.7 Manual Save button | Not started | | |
| 12.8 Flat-art styling | Not started | | |
| 12.9 Smoke tests | Not started | | |

### M13 — Juice → [wbs](../plan/plan_wbs-m13-juice.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 13.1 Coin-toss flip animation | Not started | | |
| 13.2 chips×mult ticker | Not started | | |
| 13.3 Confetti on blind clear | Not started | | |
| 13.4 SFX (toss, win/lose; no music) | Not started | | |
| 13.5 Juice is presentation-only | Not started | | |

### M14 — Test Suite Completion → [wbs](../plan/plan_wbs-m14-tests.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 14.1 Every module has a test | Not started | | |
| 14.2 Full suite 100% green | Not started | | |
| 14.3 Determinism regression test | Not started | | |
| 14.4 Boundary sweep (k×tiers) | Not started | | |

### M15 — README & Final Packaging → [wbs](../plan/plan_wbs-m15-readme.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 15.1 README install/run | Not started | | |
| 15.2 README seed entry/share | Not started | | |
| 15.3 Build playable end-to-end | Not started | | |
| 15.4 `npm run test` 100% | Not started | | |
| 15.5 Out-of-scope audit | Not started | | |

## Deliverables Produced

Each milestone produces the deliverables named in the [Scope Statement](../plan/plan_scope-statement.md). Record actual production here.

| Deliverable | Milestone | Produced | Verified | Notes |
| --- | --- | --- | --- | --- |
| Local web build (full 12-blind run) | M15 | | | |
| Source code (Vite + React + TS) | M0–M15 | | | |
| vitest suite (scoring + RNG + state) | M2–M14 | | | |
| README (run + seed sharing) | M15 | | | |
