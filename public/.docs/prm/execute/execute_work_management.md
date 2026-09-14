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
| 4.3 `pickCoin` / `unpickCoin` (1–5) | Done | 2026-09-14 | 7 tests: pick → next free play slot (left to right); play fills in pick order, holds 5; 6th pick no-op (coin stays in hand); unpick → first empty hand slot; re-pick round trip (unpick first, pick again); unpick on empty play slot no-op; pick on empty hand slot no-op |
| 4.4 `discard` (+ draw-enchant redraw) | Done | 2026-09-14 | 6 tests: plain coin → discard pile (draw pile untouched, gone for the blind); unlimited discards in one play phase; draw-1/2/3 redraw N face-down (discarded slot first, then left to right, parameterized); redraws capped by empty hand slots (full hand + draw2 → 1); short draw pile → fewer redraws. Enchanted coins injected via setState (base collection is all plain) |
| 4.5 `confirmPlay` | Done | 2026-09-14 | 4 tests: empty play → no-op (no phase change, no rng); → buff resting phase (toss transient, pinned in 4.1); unpicked hand coins stay in the hand (6 of 8, discard pile empty — discard happens at score); toss resolves picked faces (rng consumed, valid H/T faces) |
| 4.6 Toss auto (resolveFace per coin) | Done | 2026-09-14 | 3 tests: face set on every picked coin (empty play slots stay empty); golden-sequence test — store faces + rngState match an independent reference computation of the RNG draw-order contract (shuffle → no-rng draw → one face roll per picked coin in play order, hand coins never resolved); same seed + same picks → identical faces |
| 4.7 `echoReflip` (once per Echo) | Done | 2026-09-14 | 5 tests: re-flip rolls the rng once + sets echoUsed; second call on the same slot is a no-op (face + rngState unchanged); non-Echo coin cannot be re-flipped; two Echo coins have independent echoUsed flags (each gets exactly one); out-of-buff-phase call is a no-op. Echo coins injected via setState |
| 4.8 `score` (return hand, handsLeft−1) | Done | 2026-09-14 | 5 tests: ALL 8 hand coins (3 tossed + 5 unpicked) end in the discard pile (draw pile untouched); handsLeft −1 + → draw + hand/play emptied; C3 result applied (blindScore += total, cash += cash, lastScore = result — stub: none/0); last-hand score ends the blind (target missed → runEnd); out-of-buff-phase score is a no-op |
| 4.9 Out-of-phase no-op test | Done | 2026-09-14 | Full matrix: each of the 7 actions fired in every resting phase except its own (14 combinations, parameterized) — state unchanged; plus all 7 actions no-op in the menu phase (no run in progress) |
| 4.10 Full-cycle test | Done | 2026-09-14 | 2 tests: a full blind (10 cycles) runs without getting stuck — per-cycle coin conservation (every coin in exactly one place), draw pile −8 / discard pile +8 per cycle, machine loops back to draw, handsLeft −1 per hand; after hand 10 the deck is fully consumed and the blind ends (target missed → runEnd); same seed + same choices → identical blind (discard order, blindScore, cash, rngState, phase) |
| 4.11 Hand/play empty after score test | Done | 2026-09-14 | Focused conservation test: after score, hand and play are completely empty, the 8 coins that were in the hand (2 tossed + 6 unpicked) are exactly the discard pile's contents, and the draw pile is untouched |

### M5 — Pattern / Tier Matching (`src/core/scoring.ts`) → [wbs](../plan/plan_wbs-m5-tier-matching.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 5.1 `matchTier(play, boss)` reads non-null faces | Done | 2026-09-14 | 3 tests: HHT.H → threeSame (empty slots count as nothing); H.H.H → tripleRun (empty slots do not break runs — pattern read on the face sequence); HHHH. → fourRow (not jackpot) |
| 5.2 threeSame | Done | 2026-09-14 | HHTH → threeSame (smallest count where it can win — at 3 coins HHH is shadowed by tripleRun) |
| 5.3 fourSame | Done | 2026-09-14 | HHHTH → fourSame (≥4 of a face, non-adjacent; at 4 coins HHHH is shadowed by fourRow) |
| 5.4 jackpot (5-same) | Done | 2026-09-14 | HHHHH → jackpot |
| 5.5 fourRow (4-in-a-row) | Done | 2026-09-14 | HHHH → fourRow |
| 5.6 alternating | Done | 2026-09-14 | HTHTH → alternating (exactly 5 strictly alternating) |
| 5.7 tripleRun | Done | 2026-09-14 | HHH → tripleRun |
| 5.8 Priority resolution | Done | 2026-09-14 | 5 tests: HHHHH → jackpot (never fourRow/fourSame/tripleRun); HHHHT → fourRow over fourSame; HTHTH → alternating over threeSame (H 3×); HHHTH → fourSame over tripleRun; HHTT → none |
| 5.9 ≤2 slots → null | Done | 2026-09-14 | 0/1/2 filled slots (5 shapes) → none |
| 5.10 Boss rules (noAlternating / noJackpots) | Done | 2026-09-14 | noAlternating: HTHTH → none (explicit override, no fall-through to threeSame); non-alternating unaffected. noJackpots: HHHHH → fourSame (fixed demotion, not fourRow); HHHHT still fourRow. shortFuse/heavyTarget do not affect tiers |
| 5.11 One case per tier at min | Done | 2026-09-14 | Matrix: tripleRun 3, threeSame 4, fourRow 4, fourSame 5, jackpot 5, alternating 5 (smallest count where each tier can win); plus below-minimum no-match cases (HHT, HHTT → none) |
| 5.12 2-coin → null test | Done | 2026-09-14 | All 4 two-coin plays (HH/HT/TH/TT) → none |

### M6 — Scoring Pipeline (`src/core/scoring.ts`) → [wbs](../plan/plan_wbs-m6-scoring.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 6.1 Tier step | Done | 2026-09-14 | scoreHand step 1 = matchTier(play, boss); tests: HHTH → threeSame 15×1; noJackpots demotes HHHHH to fourSame through the tier step |
| 6.2 Base step (null → 0/0) | Done | 2026-09-14 | chips/mult from TIERS[tier]; no tier → { kind: 'none', cash } with no chips/mult/total |
| 6.3 Boosters step (left→right) | Done | 2026-09-14 | plusChips +10 / plusMult +1 / jackpotFever ×2 chips (jackpot tier only); magnitudes as new balance.ts constants (PLUS_CHIPS_BONUS, PLUS_MULT_BONUS, JACKPOT_FEVER_MULT); extraHand/payday ignored |
| 6.4 Score = chips × mult | Done | 2026-09-14 | boosters applied before multiplying: (15+10)×(1+1)=50; all-three-on-jackpot (50+10)×2 chips, 5 mult → 600; no-tier hand total 0 |
| 6.5 Coin cash step | Done | 2026-09-14 | $1 per Tax coin (deterministic) + $4 per Jackpot coin passing its 25% roll via chance(rng, JACKPOT_CHANCE); threshold proven (0.24 passes, 0.25/0.26 fail); merged coin pays both effects |
| 6.6 Charm-order test | Done | 2026-09-14 | [plusChips, jackpotFever] → 480 vs [jackpotFever, plusChips] → 440 on HHHHH — totals differ |
| 6.7 No-charm test | Done | 2026-09-14 | all 6 tiers with no charms: total = TIERS chips × mult for each |
| 6.8 Deterministic Tax test | Done | 2026-09-14 | counting-rng spy: Tax-only scored hand consumes 0 rng draws, pays $3 |
| 6.9 Reproducible Jackpot cash test | Done | 2026-09-14 | same seed → identical cash (5 Jackpot coins); over 20 seeds the 25% roll produces both paying and non-paying hands |
| 6.10 Null-tier zero-score test | Done | 2026-09-14 | 2-coin play with Tax + Jackpot coins → { kind: 'none' }, no total, but coin cash still pays ($5 roll-pass / $1 roll-fail) |
| — 32-hand EV test (baseline pin, per WBS note) | Done | 2026-09-14 | exhaustive enumeration of all 32 five-coin patterns through scoreHand: EV = 1870/32 = 58.4375, expected computed from TIERS × baseline distribution (not hardcoded); matches plan_balance-baseline.md corrected 2026-09-12. M4 store-test "stub" comments updated (assertions unchanged — those plays are ≤2 coins → no tier) |

### M7 — Coin Effects (`src/core/scoring.ts` + `balance.ts` + store) → [wbs](../plan/plan_wbs-m7-coin-effects.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 7.1 List the 9 (comment block) | Done | 2026-09-14 | Comment block at the top of scoring.ts listing all 9 effects grouped face (weight/doubleSide/chaos/magnetic/reverse) / cash (tax/jackpot) / draw+re-flip (draw/echo) |
| 7.2 Face effects (odds priority) | Done | 2026-09-14 | resolveFace: magnetic (75% toward left face; falls through to next priority when left is empty) > doubleSide (100/0) > chaos (uniform 0–100% odds, 2 rng draws) > weight (75/25) > base (50/50); roll; Reverse inverts after the odds stage. Favoured face read from the effect variant (post-faceParams types) |
| 7.3 Cash effects (Tax/Jackpot) | Done | 2026-09-14 | Already landed in M6 (scoreHand step 5): Tax +$1 deterministic, Jackpot +$4 on 25% rng roll — proven by M6.5/M6.8/M6.10 tests |
| 7.4 Draw-enchant (store discard) | Done | 2026-09-14 | Already landed in M4.4: discard on a draw-N coin redraws N face-down (discarded slot first) — proven by M4.4 tests |
| 7.5 Echo (store echoReflip) | Done | 2026-09-14 | Already landed in M4.7: one re-flip per Echo coin re-runs resolveFace, echoUsed gate — proven by M4.7 tests (now exercising the real M7 resolution) |
| 7.6 Merge stacks effects | Done | 2026-09-14 | store mergeCoin(fromId, toId): shop-phase action; toId gains all of fromId's effects (stack, no cap), fromId removed from the collection (either pile), free. 4 tests: basic merge + free, two face effects stack, source in discard pile, no-ops (wrong phase / unknown id / self-merge) |
| 7.7 9 isolated effect tests | Done | 2026-09-14 | Isolated tests: weight, doubleSide, chaos, magnetic, reverse, base (scoring.test.ts M7 block); tax, jackpot (M6.5/M6.8); echo, draw (M4.7/M4.4) |
| 7.8 Merged-coin test | Done | 2026-09-14 | weight+doubleSide merged coin resolves by priority (doubleSide wins); weight+tax merged coin resolves its face and still pays tax cash in scoreHand; store-level two-face-effect stack test |
| 7.9 No out-of-scope effects | Done | 2026-09-14 | grep of src/ for the 16 future effect names (Shapeshift…Insurance): zero matches (one "mirrors" comment false-positive) |

### M8 — Charms (`balance.ts` + `scoring.ts` + store) → [wbs](../plan/plan_wbs-m8-charms.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 8.1 `CHARMS` pool (5, categories) | Done | 2026-09-14 | Already in place from M1: CHARMS = the 5 defs (plusChips/plusMult/extraHand/payday/jackpotFever) with categories flip\|scoring\|pattern\|economy and baseline prices; pinned by balance.test.ts (5-charm pool test) |
| 8.2 `charms[]` is the ordering source | Done | 2026-09-14 | RunState.charms: CharmId[] (types.ts, M1) — array order is the only ordering source, no index field; scoring iterates it left→right (M6) |
| 8.3 `moveCharm(from, to)` | Done | 2026-09-14 | Store action: pure array move (splice out + splice in), allowed in run/shop phases (charm bar visible on both per SDD C7); no-ops on from===to, out of range, other phases. 2 tests: reorder round trip + no-op matrix |
| 8.4 No-duplicates via `includes` | Done | 2026-09-14 | Nothing to build in M8 — the `charms.includes(id)` ownership check lives in the M9 shop buy/offer logic (noted for M9) |
| 8.5 Removed charms absent | Done | 2026-09-14 | grep of src/ for Weighted Coin / Double-Sided / Always Heads / Re-Toss: zero definitions or types (only removal-history comments) |
| 8.6 Reorder-affects-scoring test | Done | 2026-09-14 | Store-level with deterministic pre-resolved plays: Jackpot HHHHH [plusChips, jackpotFever] → 480, after moveCharm(0,1) → 440 (ties to M6.6); commutative pair plusChips+plusMult on threeSame → 50 in both orders |

### M9 — Shop (`src/state/runStore.ts`) → [wbs](../plan/plan_wbs-m9-shop.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 9.1 Offer generation (5, no owned charm) | Done | 2026-09-14 | generateOffers (runStore): pool = unowned charms + all 11 coin effects + hand-size (while under cap); Fisher–Yates sample of 5 (no in-shop duplicates); wired into endBlind (shop entry). 5 tests: exactly 5, no owned charm, pool membership, seed determinism, no hand-size at cap |
| 9.2 `reroll` (once) | Done | 2026-09-14 | Store action: shop phase + !rerollUsed → regenerate all 5 offers (rng), rerollUsed = true; second call no-op (offers and rng state unchanged). 3 tests |
| 9.3 `buy` (deduct/add, reject) | Done | 2026-09-14 | Store action: price from CHARMS/COIN_EFFECTS/HAND_SIZE_PRICE; reject (state unchanged) when broke, charm owned, or wrong phase; charm → cash −= price, charms +, offer removed (structural match — immer drafts break reference equality). 4 tests |
| 9.4 `buy` coin rolls faceParams | Done | 2026-09-14 | purchasedEffect: Weight/Double-Side roll favoured face via rng on purchase (fixed for the run); Draw-N → { kind: 'draw', count: N }; plain → unit variant; new coin (unique id max+1) appended to the draw pile. 5 tests incl. same-seed → same rolled face |
| 9.5 `mergeCoin` (free) | Done | 2026-09-14 | Already implemented in M7 (mergeCoin store action: effects stack, source removed, cash unchanged) with 4 tests — nothing new to build |
| 9.6 `removeCoin` ($1 delete) | Done | 2026-09-14 | Store action: shop phase, cash ≥ 1, coin in either pile → delete, cash −= REMOVE_COIN_COST; no-ops when broke/unknown/wrong phase. 4 tests |
| 9.7 Hand-size upgrade (cap) | Done | 2026-09-14 | buy handSize: handSize +1 (cash −= HAND_SIZE_PRICE $10), rejected at HAND_SIZE_CAP (10); offer generation omits it at cap (9.1). 2 tests |
| 9.8 Reroll-once / owned-charm-rejected tests | Done | 2026-09-14 | Covered by the 9.2 tests (second reroll no-op, rng state unchanged) and the 9.3 test (owned charm → state unchanged) |
| 9.9 Remove-$1 / no-sell tests | Done | 2026-09-14 | Covered by the 9.6 tests: $1 from either pile, cash only goes down, and an explicit assertion that no sellCharm/removeCharm action exists on the store |

### M10 — Blind / Round / Boss Progression (`balance.ts` + store) → [wbs](../plan/plan_wbs-m10-progression.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 10.1 `BLINDS[12]` table | Done | 2026-09-14 | Already in place from M1: 12 entries, per-round small<big<boss escalating (300→3500), rewards $4/$6/$10 — pinned by balance.test.ts against the balance-baseline table |
| 10.2 `BOSS_RULES[4]` (boss only) | Done | 2026-09-14 | Already in place from M1: 4 rules, one per round; the `Blind` type puts `rule` only on the `boss` variant (no optional field on small/big); balance.test.ts asserts rules appear only on boss blinds |
| 10.3 `leaveShop` blind-start setup | Done | 2026-09-14 | Store action: blindIndex +1, round synced, handsLeft = 10 (SHORT_FUSE_HANDS 8 into the Short Fuse boss; +1 with Extra Hand), blindScore/hand/play reset, whole collection reshuffled into the draw pile (discard cleared), shop cleared, phase run. 4 tests |
| 10.4 `endBlind` met/missed | Done | 2026-09-14 | Target met → cash += reward (+$5 Payday, +$5 Heavy Target) → shop (or runEnd win after blind 11); missed → runEnd lose. Heavy Target: table target ×1.5 at runtime via HEAVY_TARGET_MULT (3500 → 5250, per SDD data). 4 tests |
| 10.5 Blind 11 cleared → win | Done | 2026-09-14 | 5250 on blind 11 → phase runEnd, won = true, $10 + $5 bonus paid; 5249 → lose. 2 tests |
| 10.6 Boss-rule-scope test | Done | 2026-09-14 | Store-level: HTHTH scores 105 on round-1 small/big but 0 on the noAlternating boss; HHHHH scores 200 on round-3 small/big but 60 (4-same) on the noJackpots boss |
| 10.7 Game-over test | Done | 2026-09-14 | Last hand ends the blind below target with $50 cash → runEnd, won = false, cash untouched (cash is not a substitute for the target) |
| 10.8 Full-progression test | Done | 2026-09-14 | Mocked-clears walk of all 12 blinds: each clear → shop with 5 offers → leaveShop → next blind (round synced, blindScore reset, handsLeft > 0); blind 11 → runEnd win; no undefined transition |

### M11 — Save / Load (`src/state/runStore.ts`) → [wbs](../plan/plan_wbs-m11-save-load.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 11.1 `save()` ({version:2,state}, explicit) | Done | 2026-09-14 | Store action: run/shop phases only; writes { version: 2, state } to localStorage key 'fifty-fifty-run' (incl. rngState + coin collection). 3 tests: shape/fields, explicit-only, menu no-op |
| 11.2 `resume()` (null/absent no-op) | Done | 2026-09-14 | Store action: absent / unparseable / v1 (non-migratable) / non-run-shop phase → no-op; valid v2 → restores seed, round/blind, cash, charms + order, collection, handSize, runScore, rngState (rng restored before any draw). 4 tests |
| 11.3 Resume in `run` (blind start) | Done | 2026-09-14 | Reset: hand/play/handPhase/lastScore/blindScore, handsLeft to the blind's initial budget (10; 8 on Short Fuse; +1 Extra Hand), whole collection re-reshuffled from the restored rngState (discard cleared). 3 tests |
| 11.4 Resume in `shop` (same offers) | Done | 2026-09-14 | Lands at the shop; offers regenerated deterministically from the restored rngState (two fresh resumes of one save → identical offers); rerollUsed preserved (a spent reroll stays spent). 2 tests |
| 11.5 Round-trip deep-equal test | Done | 2026-09-14 | save → resume in a fresh store: every persisted field deep-equals the saved state; the collection's coins and their effect payloads survive (piles compared as a set — re-reshuffled at blind start) |
| 11.6 No-autosave test | Done | 2026-09-14 | Spy on localStorage.setItem across a full walk (3 hands → clear → shop: buy/reroll/merge/remove/moveCharm → leaveShop → next-blind hand → toMenu): never called |

### Quality Gate — NASA Coding Practices (pre-M12, user-directed 2026-09-14)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| QG.1 No function > 60 lines | Done | 2026-09-14 | Refactored `createRunStore` (344 → module-level action functions) and `Coin` (94 → `CoinBadges` + `SpinningCoin` subcomponents). Then split the store into action modules — `handActions.ts` (hand machine), `shopActions.ts` (shop + progression), `saveActions.ts` (save/resume), `storeTypes.ts` (plumbing types); `runStore.ts` is now state shape + wiring only (567 → 143). `runStore.test.ts` (1918) split into per-milestone suites: `handFlow` / `charms` / `shop` / `progression` / `saveLoad` + shared `testHelpers.ts`. `debug.tsx` (dev-only) excluded. Enforced by ESLint `max-lines-per-function: 60` (tests + debug page excluded) |
| QG.2 100% test coverage (logic layer) | Done | 2026-09-14 | `src/core` + `src/state` at 100% statements/branches/functions (497/497, 298/298, 117/117). 8 new edge tests close the last branches (generated seed, draw1/draw3 variants, both favoured faces, drawHand skip, full-hand unpick, empty-slot discard, non-resumable resume). Enforced by vitest `thresholds: {100: true}` on `src/core/**` + `src/state/**`; UI files join the gate when M12 lands component tests |

### M12 — UI Screens, Theme & Interaction → [wbs](../plan/plan_wbs-m12-ui.md)

| Checkpoint | Status | Completed | Notes |
| --- | --- | --- | --- |
| 12.1 Theme tokens + lucide (no-blur-shadow) | Done | 2026-09-14 | Ceramic Tactile tokens in `index.css` `:root` (palette, tier colors, radii 8/14/22, motion, shadow rule); Tailwind `@theme`/`@theme inline` + shadcn semantic tokens wired to them; Fredoka display font (score numerals) + Geist UI; lucide-react (already present). Re-themed button (coral/teal/ink, 2px ink sticker border), coin faces (flat — no radial gradients), score ticker. **Shadow audit: no blurred drop shadows anywhere** — only hard offsets (`3px 3px 0 var(--ink)` style) + coral glow bloom on the CTA pulse (glow allowed). Also fixed 17 pre-existing `tsc -b` errors (HandSlot narrowing in handFlow.test via a `filled()` helper) so the build is green |
| 12.2 App phase router + transitions | Done | 2026-09-14 | `App.tsx` renders the screen for `RunState.phase` (menu/run/shop/runEnd) via a phase→screen map; `AnimatePresence mode="wait"` + `motion.div` keyed on phase plays the screen-in/out (UX §5: slide 24px + fade, `SPRING.soft` ≈ 300ms) on every phase change; `useReducedMotion` degrades it to a plain cross-fade (UX §8). `overflow-x-clip` on body guards the slide-in |
| 12.3 Menu (C5) | Done | 2026-09-14 | `menu.tsx`: title + tagline; seed field (6–8 chars, `maxLength=8`, blank = random) with a random-seed button (`generateSeed`, Dices icon); New Run (primary, pulse, form submit — Enter works); Resume (secondary) rendered only when `hasSave()` is true. New store action `hasSave()` (saveActions) — a resumable-save query via `parseSave` (the store stays the only localStorage layer); read once on mount via a lazy `useState` initializer. 1–5-char seed → invalid hint + disabled New Run. 5 new tests (absent / valid / unparseable / v1 / non-resumable phase) |
| 12.4 Coin component + interaction states | Done | 2026-09-14 | Replaced the M3 tap-to-toss `coin.tsx` with the SDD C6 model: `hand-coin.tsx` (face-down disc + effect badges; hover lift 4px + pointer tilt max 8° written straight to the DOM, press 2px, disabled desaturated/no-offset/not-allowed, focus-visible 3px coral ring), `play-slot.tsx` (empty = sunk dashed well with index; filled = seated coin, face-down until the toss, then face + face badge; tap → unpick), `coin-disc.tsx` (flat back "?" / H gold / T slate-blue disc + `FaceBadge` H/T pill — glyph primary, color secondary, colorblind-safe), `coin-badges.tsx` (effect badges, extracted). Pick/unpick spring via shared `layoutId` (`SPRING.snappy` hand→play, `SPRING.soft` play→hand); 6th-pick (play full) → 3px shake (CSS keyframes, `shakeKey` remount restarts it; error sfx in M13). Transform layers compose without fighting: framer `transform` on the button, CSS `translate`/`rotate` on the inner tilt div. `run.tsx` now hosts the hand + play area (auto-draw effect on `handPhase==='draw'`, pick/unpick handlers, revealed = toss/buff/score) — the rest of C6 lands in 12.5/12.6. coin.css rewritten for the new model (old SpinningCoin styles removed) |
| 12.5 3D coin (lands on Slot.face) | Done | 2026-09-14 | **Deviation from the SDD's r3f+rapier:** built with **CSS 3D transforms** instead — fiber v9 won't install on React 19.3 (peer caps `<19.3`), and CSS is inherently flat + unlit, so it upholds "never reads as realistic" with zero WebGL/WASM and a jsdom-testable path (user chose this over a React downgrade or `--legacy-peer-deps`). `toss-coin.tsx`: a two-face disc (H front, T back, `preserve-3d` + `backface-visibility`) that arcs up (`translateY` keyframe), tumbles (`rotateX`, 2 spins + face offset — H→720°, T→900°), and settles on the resolved face; the tumble finishes exactly at landing (420ms), then a small bounce + settle (700ms total). Staggered left→right (50ms/coin) so the last coin lands at ~900ms (UX §4). The outcome is **never animation-derived** — the face is already resolved in the store (confirmPlay); the animation only provides the arc + tumble + settle feel. `useReducedMotion` → a 2D cross-fade of the face (~160ms), no arc/tumble/3D, same landing face. `play-slot.tsx` now renders the `TossCoin` when revealed (toss/buff/score) and the 2D face-down coin (tappable) in play. `toss-coin.css` added (imported in index.css). No new deps; 216/216 tests, build + lint green |
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
