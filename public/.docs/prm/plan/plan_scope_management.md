# Scope Management Plan: 50/50

- Project ID: PRJ-2026-001
- Version: 1.0
- Date: 2026-09-12
- Owner: BlueCloud (PM)

Split into small files — one concern per file, readable in isolation.

## Requirement

- **Baseline.** Scope is baselined by the [Project Charter](../init/init_project_charter.md) (v1.1, 2026-09-13) plus the [Scope Statement](plan_scope-statement.md). Anything not in the scope statement is out of scope until a change is approved.
- **Change control.** Solo project: BlueCloud approves all scope changes. Every change — in or out — is logged in the change log with date and reason. No silent scope creep (charter risk #1: cut features, not the 1h target).
- **Traceability.** Every WBS component maps to at least one charter objective ([WBS Overview](plan_wbs-overview.md)).
- **Balance is not scope.** Draft balance numbers (targets, rewards, prices) live in [balance-baseline](plan_balance-baseline.md); tuning them in playtest is not a scope change.
- **Acceptance.** The M4 checklist in [wbs-m4](plan_wbs-m4-polish-done.md) is the project's acceptance checklist.

## Change Log

- 2026-09-12 — Baseline set from charter v1.0 + scope Q&A rounds 1–3 — BlueCloud — initial scope definition
- 2026-09-12 — Balance-baseline probabilities corrected (4-same 18.75%, 3-same 31.25%; EV/hand 60.0) — BlueCloud — arithmetic fix
- 2026-09-12 — No Jackpots boss: 5-same demotes to 4-same (30×2) — BlueCloud — design decision
- 2026-09-12 — One-coin charms: slot seed-determined; Re-Toss: player-picked, pre-score — BlueCloud — design decision
- 2026-09-12 — Save/resume: save anytime, resume at blind start — BlueCloud — design decision
- 2026-09-12 — Charm scoring pipeline defined (sequential chips/mult, left-to-right) — BlueCloud — design decision
- 2026-09-13 — Piggy ceramic approved: draw-from-deck hand + re-toss (discard + draw); deck refilled each blind, no discard pile; 3 coin-modifier charms removed (pool 9 → 6); "deck mechanics" moved to in-scope (charter v1.1) — BlueCloud — piggy ceramic requirement (Q&A settled 2026-09-13)
- 2026-09-13 — Balatro-style deck approved (Q&A round 2): persistent 30-coin collection (was 75, refilled per blind); finite draw pile per blind — hand shrinks on deck-out, empty slots = wilds; per-coin permanent effects (v1 core set of 9: Weight, Double-Side, Chaos, Echo, Magnetic, Reverse, Tax, Jackpot, Draw-1/2/3; 16 more documented as future content); unlimited discard — plain coins gone for the blind, draw-enchant coins redraw; re-toss + Re-Toss charm removed (charm pool 6 → 5); shop sells special coins (deck grows) + merge (stack freely, free) + remove ($1) — BlueCloud — Balatro-style deck + coin effects + discard mechanic (Q&A settled 2026-09-13)

## Define Scope

- [Scope Statement](plan_scope-statement.md) — product scope, locked core rules, scoring pipeline, in/out of scope, deliverables
- [Balance Baseline](plan_balance-baseline.md) — draft pattern values, blind targets, rewards, boss rules, charm pool (tunable)

## Work Breakdown Structure

Milestone → component decomposition (M1–M4 per charter):

- M1 — Scaffold — [wbs-m1-scaffold.md](plan_wbs-m1-scaffold.md) — 2026-09-19
- M2 — Vertical slice — [wbs-m2-vertical-slice.md](plan_wbs-m2-vertical-slice.md) — 2026-09-22
- M3 — Full 12-blind run — [wbs-m3-full-run.md](plan_wbs-m3-full-run.md) — 2026-09-26
- M4 — Polish & done — [wbs-m4-polish-done.md](plan_wbs-m4-polish-done.md) — 2026-10-03

Full tree + traceability: [wbs-overview.md](plan_wbs-overview.md)
