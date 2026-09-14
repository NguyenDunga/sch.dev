# Direct & Manage Project Work: 50/50
| Field | Value |
| --- | --- |
| **Project ID** | PRJ-2026-001 |
| **Document** | Direct & Manage Project Work |
| **Version** | 2.1 |
| **Date** | 2026-09-14 |
| **Owner** | BlueCloud (PM) |

This is the execution playbook for producing the 50/50 deliverables. It operationalizes the [Scope Management Plan](../plan/plan_scope_management.md) and the [WBS Overview](../plan/plan_wbs-overview.md) — the *what* is defined there; this file defines *how the work gets done and tracked* during execution.

> **v2.1 (2026-09-14):** checkpoint tracking **resynced** to the current WBS after the SDD alignment (engine modules per the [SDD](../../sdd/software_design_architechture.md): `scoring.ts`, `runStore.ts`, etc.) and the UX build-out (expanded M12/M13). All status is **Not started**. Module homes: pure engine in `src/core/`, the hand-phase machine + shop + save/resume in `src/state/runStore.ts`, UI in `src/pages/` + `src/components/`.

## Execution Approach

- **Solo dev loop.** One developer (BlueCloud/Qwen) executes all work. Per checkpoint: implement → `tsc` + `npm run lint` → `npm test` → `npm run dev` (playtest where relevant) → commit.
- **Milestone sequencing.** Executed in WBS order M0 → M15; a milestone isn't started until its dependencies' exit gates pass (dependencies are listed at the top of each milestone file). Gates roll up to the charter milestones via the [WBS Overview](../plan/plan_wbs-overview.md) mapping.
- **Engine-first.** The engine + store (M1–M11) is built and unit-tested before the UI (M12) and juice (M13), so presentation is a thin, skippable layer over a proven, deterministic engine.

## Work Package Tracking

One row per checkpoint, grouped by milestone. A checkpoint is `Done` only when its item in the WBS file is satisfied and the milestone exit gate is green. Update **Status** (Not started / In progress / Done) and **Completed** (date) as work is performed.

### M0 — Project Setup & Tooling → [wbs](../plan/plan_wbs-m0-setup.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 0.1 Vite + React + TS scaffold (repo root) | Done | 2026-09-14 | Already in place; root `tsconfig.json` fixed (removed deprecated `baseUrl`/`paths`) |
| 0.2 Tailwind CSS | Done | 2026-09-14 | `@tailwindcss/vite` plugin + directives in `src/index.css` |
| 0.3 shadcn/ui (base) | Done | 2026-09-14 | `components.json` + base `button`/`card`, no custom theme |
| 0.4 @dnd-kit/sortable + core | Done | 2026-09-14 | Installed `@dnd-kit/core` + `@dnd-kit/sortable` |
| 0.5 pure-rand | Done | 2026-09-14 | Already in deps |
| 0.6 vitest + testing-library, `test` script | Done | 2026-09-14 | Installed `@testing-library/react`; `"test": "vitest run"` present |
| 0.7 Folder tree (core/state/components/pages/lib) | Done | 2026-09-14 | All folders present; tests colocated `*.test.ts` |
| 0.8 `npm run dev` renders "Hello 50/50" | Done | 2026-09-14 | Dev server serves 50/50 menu (200); SSR smoke render passes, no runtime errors |
| 0.9 `npm run build` works | Done | 2026-09-14 | Build exit 0; added missing `preview` script, `dist/` previews (200) |
| 0.10 `npm test` runs clean | Done | 2026-09-14 | Exit 0 (70 tests pass) |

### M1 — Core Data Types (`src/core/types.ts`) → [wbs](../plan/plan_wbs-m1-data-types.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 1.1 Primitives/unions (Face, CoinEffectId, TierId, Phase, HandPhase, BossRuleId, CharmId, CharmCategory) | Done | 2026-09-14 | All unions per SDD block; counts exact (11 effect ids / 6 tiers / 4 boss rules / 5 hand phases) |
| 1.2 `Coin` (+ `faceParams`) | Done | 2026-09-14 | SDD no-null shape: `Coin { id; effects: CoinEffect[] }` — tagged-union effects carry their own params (replaces stale `CoinEffectId[]` + `faceParams?` wording) |
| 1.3 `Slot` / `Hand` / `Play` | Done | 2026-09-14 | SDD no-null shape: `HandSlot`/`FilledHandSlot` + `Hand`/`Play` (`{ kind: 'empty' }`, never null) |
| 1.4 `ShopOffer` union | Done | 2026-09-14 | `charm \| coin \| handSize` |
| 1.5 Record interfaces (Tier, Blind, CharmDef, CoinDef, Deck, Score) | Done | 2026-09-14 | All six per SDD block |
| 1.6 `RunState` | Done | 2026-09-14 | All 18 fields per SDD Run State block |
| 1.7 Single file, no logic/defaults | Done | 2026-09-14 | types-only; runtime helpers moved to `src/core/helpers.ts`; `BossRule` → balance.ts; legacy `HandState` → local to runStore.ts |
| 1.8 `tsc --noEmit` clean | Done | 2026-09-14 | tsc + lint clean; 70/70 tests green |

### M2 — Seeded RNG (`src/core/rng.ts`) → [wbs](../plan/plan_wbs-m2-rng.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 2.1 `createRng(seed)` → next/state/restore | Done | 2026-09-14 | `restore` via pure-rand `xoroshiro128plusFromState` (4 × int32 state) |
| 2.2 `generateSeed()` | Done | 2026-09-14 | 6–8 char [A-Za-z0-9] via `crypto.getRandomValues` (global random banned in core/state) |
| 2.3 Determinism test | Done | 2026-09-14 | 100-draw deep-equal sequences |
| 2.4 Different-seed test | Done | 2026-09-14 | 100-draw sequences differ |
| 2.5 `state()`/`restore()` round-trip | Done | 2026-09-14 | mid-sequence snapshot restored into a fresh Rng; continuations exact |
| 2.6 Boolean helper 0.25 band test | Done | 2026-09-14 | `chance(rng, p)` + `intBetween(rng, min, max)` derived from `next()`; 10,000 draws in [0.22, 0.28] |

### M3 — Deck & Draw Pile (`src/core/deck.ts`) → [wbs](../plan/plan_wbs-m3-deck.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 3.1 `buildCollection()` | Done | 2026-09-14 | Fresh module (v1.0 legacy `deck.ts`/`deck.test.ts` dropped): no-arg `buildCollection()` using `BASE_DECK_SIZE` from balance.ts; legacy store call-site updated; tsc + lint clean, 68/68 tests green |
| 3.2 `shuffleCollection(rng, deck)` | Done | 2026-09-14 | 6 tests: merge + clear discard, multiset preserved, seed-deterministic, different seeds differ, one rng draw per swap (draw-order contract pinned), input unmutated |
| 3.3 `drawFromDeck(deck)` (none on empty) | Done | 2026-09-14 | SDD C11 (source of truth) adopted: peek + `Option<Coin>`, `none` on empty — WBS “pop + `Coin | null`” wording was v1.0-era, reconciled in the plan file; 2 tests (peek order/no-consume, purity) |
| 3.4 `discardToPile` / `returnHandToPile` | Done | 2026-09-14 | 5 tests: append (draw pile untouched), hand order + empty slots count as nothing, append to existing discards, deck + hand unmutated |
| 3.5 Empty-pile → none test | Done | 2026-09-14 | `drawFromDeck` on an empty draw pile returns `none`, no throw |
| 3.6 No mid-blind reshuffle test | Done | 2026-09-14 | Drain the 5-coin pile; hand + discards grow to 5, draw pile stays empty, further draws yield `none` |
| 3.7 Shuffle clears discard test | Done | 2026-09-14 | Asymmetric 2+4 split: discard cleared, drawPile length = collection size (6) |

### M4 — Hand Phase State Machine (`src/state/runStore.ts`) → [wbs](../plan/plan_wbs-m4-hand-phase.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 4.1 `handPhase` 5-phase cycle | Done | 2026-09-14 | Fresh 5-phase store replaces v1.0 legacy runStore (all C4 actions shipped, phase-guarded); transient `toss`/`score` are observable separate sets; 2 tests: cycle invariant via recorded phase transitions + out-of-phase no-ops. C3 stubs (`resolveFace`/`matchTier`/`scoreHand`) ship with final signatures; `HAND_SIZE`/`PLAY_SIZE` added to balance.ts; run screen placeholder until M12 |
| 4.2 `drawHand` (auto) | Done | 2026-09-14 | 5 tests: fills handSize distinct coins + → play (draw pile shrinks, discard empty); face-down = no rng consumption (rngState unchanged); short pile (3) → 3 filled + 5 empty slots; empty pile at hand start → auto-skip (handsLeft −1, no score, stays in draw) + last-hand skip ends the blind. Auto-skip is a 2026-09-14 design decision (SDD gap), recorded in SDD C4 + plan |
| 4.3 `pickCoin` / `unpickCoin` (1–5) | In progress | | | Action implemented in the M4.1 store skeleton; verification tests pending |
| 4.4 `discard` (+ draw-enchant redraw) | In progress | | | Action implemented in the M4.1 store skeleton; verification tests pending |
| 4.5 `confirmPlay` | In progress | | | Action implemented in the M4.1 store skeleton; verification tests pending |
| 4.6 Toss auto (resolveFace per coin) | In progress | | | Action implemented in the M4.1 store skeleton; verification tests pending |
| 4.7 `echoReflip` (once per Echo) | In progress | | | Action implemented in the M4.1 store skeleton; verification tests pending |
| 4.8 `score` (return hand, handsLeft−1) | In progress | | | Action implemented in the M4.1 store skeleton; verification tests pending |
| 4.9 Out-of-phase no-op test | In progress | | | Partial: 4.1 ships a no-op test; full per-action matrix pending |
| 4.10 Full-cycle test | In progress | | | Partial: 4.1 runs two full cycles; handsLeft−1 assertion pending |
| 4.11 Hand/play empty after score test | In progress | | | Action implemented in the M4.1 store skeleton; verification tests pending |

### M5 — Pattern / Tier Matching (`src/core/scoring.ts`) → [wbs](../plan/plan_wbs-m5-tier-matching.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 5.1 `matchTier(play, boss)` reads non-null faces | Not started | | |
| 5.2 threeSame | Not started | | |
| 5.3 fourSame | Not started | | |
| 5.4 jackpot (5-same) | Not started | | |
| 5.5 fourRow (4-in-a-row) | Not started | | |
| 5.6 alternating | Not started | | |
| 5.7 tripleRun | Not started | | |
| 5.8 Priority resolution | Not started | | |
| 5.9 ≤2 slots → null | Not started | | |
| 5.10 Boss rules (noAlternating / noJackpots) | Not started | | |
| 5.11 One case per tier at min | Not started | | |
| 5.12 2-coin → null test | Not started | | |

### M6 — Scoring Pipeline (`src/core/scoring.ts`) → [wbs](../plan/plan_wbs-m6-scoring.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 6.1 Tier step | Not started | | |
| 6.2 Base step (null → 0/0) | Not started | | |
| 6.3 Boosters step (left→right) | Not started | | |
| 6.4 Score = chips × mult | Not started | | |
| 6.5 Coin cash step | Not started | | |
| 6.6 Charm-order test | Not started | | |
| 6.7 No-charm test | Not started | | |
| 6.8 Deterministic Tax test | Not started | | |
| 6.9 Reproducible Jackpot cash test | Not started | | |
| 6.10 Null-tier zero-score test | Not started | | |

### M7 — Coin Effects (`src/core/scoring.ts` + `balance.ts` + store) → [wbs](../plan/plan_wbs-m7-coin-effects.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 7.1 List the 9 (comment block) | Not started | | |
| 7.2 Face effects (odds priority) | Not started | | |
| 7.3 Cash effects (Tax/Jackpot) | Not started | | |
| 7.4 Draw-enchant (store discard) | Not started | | |
| 7.5 Echo (store echoReflip) | Not started | | |
| 7.6 Merge stacks effects | Not started | | |
| 7.7 9 isolated effect tests | Not started | | |
| 7.8 Merged-coin test | Not started | | |
| 7.9 No out-of-scope effects | Not started | | |

### M8 — Charms (`balance.ts` + `scoring.ts` + store) → [wbs](../plan/plan_wbs-m8-charms.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 8.1 `CHARMS` pool (5, categories) | Not started | | |
| 8.2 `charms[]` is the ordering source | Not started | | |
| 8.3 `moveCharm(from, to)` | Not started | | |
| 8.4 No-duplicates via `includes` | Not started | | |
| 8.5 Removed charms absent | Not started | | |
| 8.6 Reorder-affects-scoring test | Not started | | |

### M9 — Shop (`src/state/runStore.ts`) → [wbs](../plan/plan_wbs-m9-shop.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 9.1 Offer generation (5, no owned charm) | Not started | | |
| 9.2 `reroll` (once) | Not started | | |
| 9.3 `buy` (deduct/add, reject) | Not started | | |
| 9.4 `buy` coin rolls faceParams | Not started | | |
| 9.5 `mergeCoin` (free) | Not started | | |
| 9.6 `removeCoin` ($1 delete) | Not started | | |
| 9.7 Hand-size upgrade (cap) | Not started | | |
| 9.8 Reroll-once / owned-charm-rejected tests | Not started | | |
| 9.9 Remove-$1 / no-sell tests | Not started | | |

### M10 — Blind / Round / Boss Progression (`balance.ts` + store) → [wbs](../plan/plan_wbs-m10-progression.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 10.1 `BLINDS[12]` table | Not started | | |
| 10.2 `BOSS_RULES[4]` (boss only) | Not started | | |
| 10.3 `leaveShop` blind-start setup | Not started | | |
| 10.4 `endBlind` met/missed | Not started | | |
| 10.5 Blind 11 cleared → win | Not started | | |
| 10.6 Boss-rule-scope test | Not started | | |
| 10.7 Game-over test | Not started | | |
| 10.8 Full-progression test | Not started | | |

### M11 — Save / Load (`src/state/runStore.ts`) → [wbs](../plan/plan_wbs-m11-save-load.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 11.1 `save()` ({version:2,state}, explicit) | Not started | | |
| 11.2 `resume()` (null/absent no-op) | Not started | | |
| 11.3 Resume in `run` (blind start) | Not started | | |
| 11.4 Resume in `shop` (same offers) | Not started | | |
| 11.5 Round-trip deep-equal test | Not started | | |
| 11.6 No-autosave test | Not started | | |

### M12 — UI Screens, Theme & Interaction → [wbs](../plan/plan_wbs-m12-ui.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 12.1 Theme tokens + lucide (no-blur-shadow) | Not started | | |
| 12.2 App phase router + transitions | Not started | | |
| 12.3 Menu (C5) | Not started | | |
| 12.4 Coin component + interaction states | Not started | | |
| 12.5 3D coin (r3f, lands on Slot.face) | Not started | | |
| 12.6 Run screen (draw/play/toss/buff/score) | Not started | | |
| 12.7 Shop screen (C8) | Not started | | |
| 12.8 Run-end (C9) | Not started | | |
| 12.9 Manual Save button | Not started | | |
| 12.10 Tactile controls pass (all states) | Not started | | |
| 12.11 Screen smoke tests | Not started | | |

### M13 — Juice (Choreography, Particles, Shake & Sound) → [wbs](../plan/plan_wbs-m13-juice.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 13.1 Deal/pick/discard motion | Not started | | |
| 13.2 Toss + Echo flip (spring-bouncy) | Not started | | |
| 13.3 Scoring choreography (7 beats) | Not started | | |
| 13.4 Skip/fast-forward (no number change) | Not started | | |
| 13.5 Particles + confetti | Not started | | |
| 13.6 Screen shake (0 on reduced-motion) | Not started | | |
| 13.7 Sound map (howler, no music) | Not started | | |
| 13.8 Reduced-motion / a11y path | Not started | | |
| 13.9 Perf (60fps, code-split, non-blocking) | Not started | | |

### M14 — Test Suite Completion → [wbs](../plan/plan_wbs-m14-tests.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 14.1 Every core module + store has a test | Not started | | |
| 14.2 Full suite 100% green | Not started | | |
| 14.3 Determinism regression (draw-order + state/restore) | Not started | | |
| 14.4 Boundary sweep (k × tiers) | Not started | | |
| 14.5 No `Math.random` in core/state | Not started | | |

### M15 — README & Final Packaging → [wbs](../plan/plan_wbs-m15-readme.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 15.1 README install/run | Not started | | |
| 15.2 README seed entry/share | Not started | | |
| 15.3 Build playable end-to-end | Not started | | |
| 15.4 `npm test` 100% | Not started | | |
| 15.5 Out-of-scope audit | Not started | | |

## Deliverables Produced

Each milestone produces the deliverables named in the [Scope Statement](../plan/plan_scope-statement.md). Record actual production here.

| Deliverable | Milestone | Produced | Verified | Notes |
| --- | --- | --- | --- | --- |
| Local web build (full 12-blind run) | M15 | | | |
| Source code (Vite + React + TS) | M0–M15 | | | |
| vitest suite (scoring + RNG + state) | M2–M14 | | | |
| README (run + seed sharing) | M15 | | | |
