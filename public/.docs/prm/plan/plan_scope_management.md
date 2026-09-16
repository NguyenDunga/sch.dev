# Scope Management Plan: 50/50

- Project ID: PRJ-2026-001
- Version: 1.1
- Date: 2026-09-14
- Owner: BlueCloud (PM)

Split into small files — one concern per file, readable in isolation.

## Requirement

- **Baseline.** Scope is baselined by the [Project Charter](../init/init_project_charter.md) (v1.1, 2026-09-13) plus the [Scope Statement](plan_scope-statement.md). Anything not in the scope statement is out of scope until a change is approved.
- **Change control.** Solo project: BlueCloud approves all scope changes. Every change — in or out — is logged in the change log with date and reason. No silent scope creep (charter risk #1: cut features, not the 1h target).
- **Traceability.** Every WBS milestone maps to at least one charter objective ([WBS Overview](plan_wbs-overview.md)).
- **Balance is not scope.** Draft balance numbers (targets, rewards, prices) live in [balance-baseline](plan_balance-baseline.md); tuning them in playtest is not a scope change.
- **Acceptance.** The Final Acceptance Checklist in [wbs-m15](plan_wbs-m15-readme.md) is the project's acceptance checklist.

## Change Log

- 2026-09-12 — Baseline set from charter v1.0 + scope Q&A rounds 1–3 — BlueCloud — initial scope definition
- 2026-09-12 — Balance-baseline probabilities corrected (4-same 18.75%, 3-same 31.25%; EV/hand 60.0) — BlueCloud — arithmetic fix
- 2026-09-12 — No Jackpots boss: 5-same demotes to 4-same (30×2) — BlueCloud — design decision
- 2026-09-12 — One-coin charms: slot seed-determined; Re-Toss: player-picked, pre-score — BlueCloud — design decision
- 2026-09-12 — Save/resume: save anytime, resume at blind start — BlueCloud — design decision
- 2026-09-12 — Charm scoring pipeline defined (sequential chips/mult, left-to-right) — BlueCloud — design decision
- 2026-09-13 — Piggy ceramic approved: draw-from-deck hand + re-toss (discard + draw); deck refilled each blind, no discard pile; 3 coin-modifier charms removed (pool 9 → 6); "deck mechanics" moved to in-scope (charter v1.1) — BlueCloud — piggy ceramic requirement (Q&A settled 2026-09-13)
- 2026-09-13 — Balatro-style deck approved (Q&A round 2): persistent 30-coin collection (was 75, refilled per blind); finite draw pile per blind — hand shrinks on deck-out, empty slots = wilds; per-coin permanent effects (v1 core set of 9: Weight, Double-Side, Chaos, Echo, Magnetic, Reverse, Tax, Jackpot, Draw-1/2/3; 16 more documented as future content); unlimited discard — plain coins gone for the blind, draw-enchant coins redraw; re-toss + Re-Toss charm removed (charm pool 6 → 5); shop sells special coins (deck grows) + merge (stack freely, free) + remove ($1) — BlueCloud — Balatro-style deck + coin effects + discard mechanic (Q&A settled 2026-09-13)
- 2026-09-14 — WBS re-based from the 4-milestone system (M1 Scaffold / M2 Vertical slice / M3 Full run / M4 Polish) to the 16-milestone M0–M15 build breakdown; all checkpoint tracking reset to Not started; charter dates and quality gates unchanged (see the mapping in [WBS Overview](plan_wbs-overview.md)) — BlueCloud — planning refinement (not a product-scope change)
- 2026-09-14 — UX/juice amendment ("Balatro-grade smoothness"): new **Ceramic Tactile** flat/low-shadow theme (visual reskin); **juice scope expanded** beyond the original coin-toss animation + ticker + confetti + toss/win/lose SFX to add particle bursts, screen shake, a flat-shaded **3D coin** (@react-three/fiber + drei + rapier), and a richer per-event SFX set; icons via lucide-react. Still flat art, **still no music**. New [UX design doc](../../sdd/software_design_ux.md) is the source of truth. Charter §3 (juice)/§4 (stack) amended — BlueCloud — UX build-out (approved 2026-09-14)
- 2026-09-15 — **m13a rebalance + interaction overhaul** (game-design + one scope change): core loop retuned to **4 hands per blind** (was 10) on a **24-coin mixed starter deck** (16 plain + 8 Weight-Heads, was 80 all-plain) with **keep-unplayed** coins (only played coins discarded after scoring); blind targets **halved**; **scope change** — the **unused-hand cash bonus**, previously out of scope, is now **in scope** as the early-clear payout; interaction overhaul (drag-and-drop + drop-zone play/discard, live pre-computed score, auto-advancing phases). Design in [WBS m13a](plan_wbs-m13a-layout.md), numbers in [balance-baseline](plan_balance-baseline.md) — EDS — faster, weightier loop where upgrades matter (m13a)

## Define Scope

- [Scope Statement](plan_scope-statement.md) — product scope, locked core rules, scoring pipeline, in/out of scope, deliverables
- [Balance Baseline](plan_balance-baseline.md) — draft pattern values, blind targets, rewards, boss rules, charm pool (tunable)

## Work Breakdown Structure

The build is decomposed into **16 sequential milestones (M0–M15)** — one file per milestone. Milestones roll up to the four dated charter key milestones via the mapping in the [WBS Overview](plan_wbs-overview.md).

- Full tree, milestone index, charter-objective traceability, and charter/quality-gate mapping: [wbs-overview.md](plan_wbs-overview.md)
- Per-milestone checkpoints: `plan_wbs-m0-setup.md` … `plan_wbs-m15-readme.md` (linked from the overview)
- Live execution status: [Direct & Manage Project Work](../execute/execute_work_management.md)
