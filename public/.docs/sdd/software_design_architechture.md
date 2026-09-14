# Software Architecture: 50/50

- Project ID: PRJ-2026-001
- Version: 1.0
- Date: 2026-09-12
- Owner: Qwen (dev)
- Baseline: [Scope Statement](../prm/plan/plan_scope-statement.md) + [Scope Management Plan](../prm/plan/plan_scope_management.md)

Entry point of the Software Design Description (SDD). Split into small files — one concern per file, readable in isolation:

| File | Concern |
| --- | --- |
| [Architecture](software_design_architechture.md) | system overview, layers, key decisions, tech stack |
| [Component Design](software_design_component.md) | components, interfaces, state machine, interactions |
| [Data Design](software_design_data.md) | types, run state, RNG contract, persistence, balance data |
| [Configuration Management](software_design_management.md) | repo layout, build, version control, change control, traceability |

## System Overview

50/50 is a single-player, browser-only roguelike. No backend, no network: one Vite SPA running entirely client-side. A full run (12 blinds, ~1 hour) is a deterministic function of (seed, player choices) — every random draw (collection reshuffles, face rolls on toss / echo re-flip, shop offers) comes from one seeded RNG.

## Architecture Style

Three layers, strictly one-way dependencies (UI → state → core):

```
┌────────────────────────────────────────────────┐
│ UI — React + Tailwind + shadcn/ui              │
│ screens (menu / run / shop / run-end), charm   │
│ bar, juice (animation, ticker, confetti, SFX)  │
├────────────────────────────────────────────────┤
│ State — zustand + immer + persist              │
│ single run store; manual save → localStorage   │
├────────────────────────────────────────────────┤
│ Core — pure TypeScript                         │
│ RNG, scoring pipeline, balance tables          │
└────────────────────────────────────────────────┘
```

- **Core** — pure functions: input in, output out. No React, no store, no DOM, no side effects. This is what vitest covers ([Testing Strategy](../prm/plan/plan_testing-strategy.md): core + game state).
- **State** — one zustand store holds the entire run; immer for updates; persist middleware for save/resume.
- **UI** — thin components that read store state and call store actions. No game logic in components.

**Dependency rule:** core imports nothing from state or UI; state imports core; UI imports both. Enforced by convention (solo project); a lint rule is optional.

## Key Design Decisions

| # | Decision | Rationale |
| --- | --- | --- |
| 1 | Pure-function scoring pipeline | Unit-testable without DOM; deterministic; charm-order logic in one place (charter risk #5) |
| 2 | One seeded RNG (pure-rand) per run | Reproducible, shareable runs (charter objective 3); cheap balance A/B (charter risk #3) |
| 3 | Single zustand store | One run = one state object; trivial to serialize for save/resume; no cross-store sync |
| 4 | Balance values as data, not code | Playtest tuning = edit a table, not logic (scope plan: "balance is not scope") |
| 5 | No backend / no network | Local-only delivery (charter §3), $0 budget |
| 6 | Flat CSS-drawn art, no sprite assets | Zero budget; charter assumption §9 |
| 7 | 5-phase hand flow | Draw 8 (hand size, shop-upgradable) face-down → freely play 1–5 (unlimited discard: plain coins gone for the blind; draw-enchant coins redraw into the hand) → game tosses the picked coins → buff (Echo re-flips + owned charms) → player taps Score (explicit — unlimited discard makes an auto-score timer hostile); deliberate hand-building (Q&A 2026-09-13 round 2; phase definition Q&A 2026-09-14, round 3; free 1–5 toss Q&A 2026-09-14, round 4) |
| 8 | Save in shop resumes at shop | Offers regenerated identically from preserved RNG state (Q&A 2026-09-12) |
| 9 | Balatro-style coin deck | Persistent coin collection (base 80, re-tuned 2026-09-14 no-wilds calculation + purchased special coins); reshuffled per blind, finite within a blind (hand shrinks on deck-out, empty slots count as **nothing** — Q&A 2026-09-14, round 4); per-coin permanent effects (v1 core set of 9); unlimited discard with draw-enchant redraws; replaces re-toss + the 3 coin-modifier charms (Q&A 2026-09-13, round 2). No circulation: all hand coins go to the discard pile after scoring (Q&A 2026-09-14, round 3) |

## Tech Stack (frozen — charter §4)

| Concern | Library |
| --- | --- |
| Build / dev server | Vite |
| UI | React + TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui (copy-in components) |
| State | zustand + immer + persist |
| RNG | pure-rand |
| Charm reorder | @dnd-kit/sortable |
| Animation | @formkit/auto-animate |
| Juice | canvas-confetti, howler (SFX), react-countup / motion (ticker) |
| Tests | vitest |

All MIT/open-source, $0 (charter §7).

## Runtime Data Flow (one hand)

```
[draw phase, automatic] store.drawHand()
  → core.drawFromDeck(deck) ×handSize (base 8) → face-down coins in the hand (null when the pile is short)
[play phase] player freely picks 1–5 coins into the play slots
  → store.pickCoin(i) / store.unpickCoin(i)
  → [discard: unlimited — player may discard any hand coins]
    → store.discard(i) → core.discardToPile(deck, coin)
      (+ core.drawFromDeck ×N face-down if the coin has a draw enchant)
[toss phase, automatic] store.confirmPlay()
  → core.resolveFace(rng, coin, leftFace) per picked coin, in play order (rng advances per coin effect)
[buff phase] player may re-flip each Echo coin once
  → store.echoReflip(i) → core.resolveFace(rng, coin, leftFace) again
  → owned charms (buffs) apply to the tossed coins
[score phase] player taps Score (explicit — no auto-score timer)
  → core.scoreHand(play, bossRule, charms, rng) → {tier, chips, mult, total, cash}
  → core.returnHandToPile(deck, hand) → all hand coins (tossed + unpicked) → discard pile
  → store: blindScore += total; cash += coin cash; handsLeft -= 1
  → UI: coin animation, chips×mult ticker, SFX
  → handsLeft == 0 → blind clear (shop / run win) or run end (lose)
```

## Concurrency & Performance

- Single-threaded browser; no async game logic (SFX is fire-and-forget).
- 60 fps, no jank on a normal laptop for coin-toss animation, ticker, and confetti (quality standard) — animation is CSS/canvas and never blocks scoring.

## Persistence

- Manual save only (no autosave — scope statement): store action `save()` serializes the run (including RNG state) to localStorage via zustand persist. One save slot; saving overwrites.
- Resume returns to the **start of the current blind** — hands and blind score reset; if saved in the shop, resume at the shop with the same offers. Details in [Data Design](software_design_data.md).

## Change Log

| Date | Change | Approved by | Reason |
| --- | --- | --- | --- |
| 2026-09-12 | SDD baseline v1.0 (4 files) | BlueCloud (Q&A answers) | SDD writing round — Q&A 1: auto-score hand flow; shop save resumes at shop |
| 2026-09-12 | RNG: xoshiro256** → xoroshiro128plus (pure-rand has no xoshiro256/xmur3 exports in any version; xmur3 vendored in core) | Qwen | SDD correction — library API assumption was wrong; scope statement unchanged (pure-rand, seed string, reproducibility) |
| 2026-09-13 | Piggy ceramic deck: hand drawn from a coin-deck; re-toss = discard + draw; 3 coin-modifier charms removed (pool 9 → 6); deck mechanics now in-scope | BlueCloud (Q&A answers) | Piggy ceramic requirement — scope change |
| 2026-09-13 | Balatro-style deck (Q&A round 2): persistent 30-coin collection, finite draw pile per blind (hand shrinks, wild empty slots), per-coin permanent effects (v1 core set of 9), unlimited discard with draw-enchant redraws; re-toss + Re-Toss charm removed (charm pool 6 → 5); shop sells coins + merge/remove | BlueCloud (Q&A answers) | Balatro-style deck + coin effects + discard mechanic — scope change |
| 2026-09-14 | 5-phase hand flow (Q&A round 3): draw 8 (hand size, shop-upgradable) → play up to 5 → toss → buff (existing charms only) → score; all hand coins go to the per-blind discard pile after scoring (no circulation — draw pile stays finite per blind); new store actions drawHand/pickCoin/confirmPlay, new shop offer kind handSize | BlueCloud (Q&A answers) | Phase definition requirement — scope change |
| 2026-09-14 | Round 4: empty slots count as **nothing** (wilds removed — pattern evaluated on the tossed coins only); player freely tosses 1–5 coins per hand; base deck re-tuned 74 → 80 (no-wilds calculation: all 10 hands full, no dead hands) | BlueCloud (Q&A answers) | Scoring rule change — scope change; deck size — balance change |
