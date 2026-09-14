# Scope Statement: 50/50

Part of the [Scope Management Plan](plan_scope_management.md). Baseline: charter v1.0 + scope Q&A (2026-09-12).

## Product Scope

Balatro-style roguelike where a deck of ceramic coins (piggy ceramics) replaces cards. Every hand follows a 5-phase flow — draw 8 coins (hand size, upgradable in the shop) from a finite deck, freely pick 1–5 to play, the game tosses them, buffs (charms) are applied, then the hand scores; scoring comes from heads/tails patterns. Individual coins can carry permanent effects (v1 core set of 9, 2026-09-13 Q&A round 2). A full run is 4 rounds × 3 blinds (small/big/boss) = 12 blinds, ~1 hour.

## Core Rules (Locked)

- Hand: 8 coins drawn from the coin deck per hand (hand size, upgradable in the shop); the player freely picks **1–5** to play; 10 hands per blind; unlimited discard per hand
- Deck: a coin collection (base 80 plain 50/50 coins, re-tuned 2026-09-14 for the 8-coin hand flow — see balance-baseline + purchased special coins) that persists for the whole run; reshuffled into the draw pile at the start of each blind; **no reshuffle within a blind** — when the draw pile runs out, the hand shrinks; empty slots count as **nothing** (the pattern is evaluated on the tossed coins only); discarded plain coins **and all hand coins after scoring** go to a per-blind discard pile (gone for the rest of the blind)
- Coin effects: permanent per-coin effects (v1 core set of 9 in balance-baseline; face effects, cash effects, discard draw-enchant); coins can hold multiple effects via shop merge
- Patterns: 6 tiers — 3 count (5/4/3-same) + 3 sequence (4-in-a-row, alternating, triple-run); a hand scores the highest-value tier it matches (empty slots count as nothing — a k-coin play can only match tiers whose structure fits in k coins)
- Scoring: chips × mult, Balatro-style; base values in [balance-baseline](plan_balance-baseline.md)
- Blinds: small → big → boss per round, 4 rounds; targets escalate (draft in balance-baseline)
- Boss: 4 distinct fixed rules, one per round (drafts in balance-baseline)
- Failure: miss the blind target in 10 hands → game over, run ends
- Charms: 5-charm pool (draft in balance-baseline); left-to-right order matters, drag to reorder
- Shop: 5 slots + 1 free reroll between blinds; sells charms and special coins; merge (sacrifice a coin into another, free) and remove (delete a coin, $1) actions
- Economy: blind rewards only (small < big < boss); no sell-back, no hand bonuses
- Save: manual save to localStorage; no autosave. Save anytime; resume returns to the start of the current blind
- Seed: short string (6–8 chars) via pure-rand; same seed = identical run

## Hand Phase Flow (Locked — Q&A round 3, 2026-09-14)

Every hand runs through five phases, in order:

1. **Draw** (automatic) — the game draws 8 coins (hand size) face-down from the draw pile into the hand. Hand size starts at 8 and is upgradable in the shop (new shop offer type). If the draw pile is short, the hand shrinks; empty slots count as nothing.
2. **Play** (player) — the player freely picks **1–5** coins from the hand to play. Unlimited discard (base mechanic): the player may discard any coins from the hand — plain coins go to the discard pile (gone for the rest of the blind, no redraw); coins with a draw enchant redraw N fresh coins face-down from the draw pile into the hand (N = enchant tier).
3. **Toss** (automatic) — the game tosses the picked coins one at a time; each coin's face is resolved through its effects (odds stage → roll → Reverse; order in balance-baseline).
4. **Buff** (player) — each Echo coin in the play may be re-flipped once (player clicks the coin); owned charms (buffs) are applied to the tossed coins before scoring. The buff phase uses **existing charms only** — no new item system (Q&A round 3).
5. **Score** (player taps Score, explicit — no auto-score timer) — tier → base → boosters → total + coin cash (see Scoring Pipeline below). After scoring, **all hand coins (tossed + unpicked) go to the per-blind discard pile** (gone for the rest of the blind — no circulation, confirmed Q&A round 3); handsLeft -= 1; next hand starts at Draw.

## Scoring Pipeline (Locked — designed 2026-09-12, approved by BlueCloud; deck update 2026-09-13; Balatro-style deck + discard + coin effects, 2026-09-13 Q&A round 2; phase flow, 2026-09-14 Q&A round 3; empty slots = nothing + free 1–5 toss, 2026-09-14 Q&A round 4)

Per hand, in order (phases per the Hand Phase Flow above):

1. **Draw** — 8 coins (hand size) drawn face-down from the draw pile into the hand (if the pile is empty, the hand is shorter)
2. **Play** — freely pick 1–5; unlimited discard: plain coins go to the discard pile (gone for the rest of the blind); draw-enchant coins redraw N fresh coins face-down into the hand
3. **Toss** — the game tosses the picked coins one at a time; face resolution (odds stage → roll → Reverse)
4. **Buff** — Echo re-flips (once per Echo coin); owned charms applied to the tossed coins
5. **Tier** — highest tier matched per the balance-baseline table, with the round's boss rule applied; **empty slots count as nothing** — the pattern is evaluated on the tossed coins only, so a k-coin play can only match tiers whose structure fits in k coins (4-in-a-row/4-same need 4+, alternating needs exactly 5, triple-run/3-same need 3+); a play of 2 or fewer coins matches no tier (scores 0)
6. **Base** — chips = tier chips, mult = tier mult
7. **Boosters** — apply owned scoring boosters in left-to-right charm-bar order: +Chips → chips += 10; +Mult → mult += 1; Jackpot Fever → if tier is Jackpot, chips ×= 2
8. **Score** — total = chips × mult, added to the blind total
9. **Coin cash** — cash effects pay money separately at score time: Tax → +$1 per Tax coin in the play; Jackpot → 25% chance per coin for +$4
10. **Return** — all hand coins (tossed + unpicked) go to the discard pile; handsLeft -= 1

Charm interactions:
- No duplicates of a charm (shop rule), so at most one of each
- In the current pool, order only changes the outcome for +Chips combined with Jackpot Fever; the pipeline is general so future boosters can be order-sensitive
- The 3 coin-modifier charms (Weighted Coin, Double-Sided, Always Heads) were removed 2026-09-13 — per-coin effects now fill that role
- The Re-Toss charm and the limited re-toss mechanic were removed 2026-09-13 (Q&A round 2) — unlimited discard supersedes them

## In Scope

- Core loop: 5-phase hand flow — draw 8 (hand size, upgradable) → play 1–5 → toss → buff (charms) → score — 10 hands per blind, 12 blinds
- Coin deck (Balatro-style): persistent coin collection, finite draw pile per blind (no circulation — hand coins go to the discard pile after scoring), hand shrinks on deck-out, empty slots count as nothing, per-blind discard pile, unlimited discard with draw-enchant redraws
- Coin effects: v1 core set of 9 (face effects, cash effects, discard draw-enchant) with shop merge (stack freely) and remove
- 6-tier pattern scoring, 4 boss rules, 5 charms
- Shop: 5 offers (charms + special coins + hand-size upgrade) + 1 free reroll + merge/remove actions
- Seeded runs with shareable short-string seeds
- Manual save/resume via localStorage
- UI: flat art on the **Ceramic Tactile** theme (low-shadow — no blurred drop shadows), Tailwind + shadcn/ui, lucide-react icons; screens: menu, run, shop, game over. Tactile interaction on every element (hover/press/select/disabled/focus). See [UX design](../../sdd/software_design_ux.md).
- Charm bar with drag-to-reorder (@dnd-kit/sortable)
- 3D coin: flat-shaded 3D coin flip + toss physics (@react-three/fiber + drei + rapier), landing on the engine-resolved face (juice never decides the outcome)
- Juice (expanded 2026-09-14): scoring choreography (chips→mult→total count-up), particle bursts, screen shake, confetti on blind clear, and a per-event SFX set (deal, pick, discard, toss, tier hit, chip tick, mult, cash, buttons, win/lose stingers) — **still flat art, still no music**; all juice is presentational and skippable
- Tests: vitest covering scoring + RNG core logic
- README: how to run + how to enter/share seeds

## Out of Scope

Charter:
- Cards, poker hands (pokersolver not used) — the piggy ceramic coin-deck is the in-scope deck mechanic
- Multiplayer / online play
- Public hosting / Steam (local-only)
- Music; mobile-native builds
- Localization, achievements, leaderboards

Added in scope Q&A:
- Autosave / mid-blind resume (manual save only; resume at blind start)
- Charm sell-back, unused-hand cash bonus (blind rewards only)
- Random boss rules (4 fixed)
- More than 10 charms at launch

Added in piggy ceramic Q&A (2026-09-13):
- Coin-modifier charms (Weighted Coin / Double-Sided / Always Heads) — removed in favor of the deck

Added in Balatro-style deck Q&A (2026-09-13, round 2):
- Re-toss mechanic + Re-Toss charm — removed in favor of unlimited discard
- The 16 non-core coin effects (Extra, Shapeshift, Momentum, Interest, Gambler, Mirror, Anchor, Parasite, Conductor, Cursed, Unstable, Time Bomb, Phoenix, Duplicator, Sacrifice, Insurance) — documented as future content, not in v1
- Deck reshuffle within a blind (the draw pile is finite; hand shrinks on deck-out)
- Selling coins back for cash (remove is a flat $1 delete, not a sale)

Added in phase-flow Q&A (2026-09-14, round 3):
- Coin circulation / per-hand recycle of the discard pile (Balatro-style pile swap) — declined; the draw pile stays finite per blind, hand coins are gone for the rest of the blind after scoring
- New buff / item system — the buff phase uses existing charms only

Added in round-4 Q&A (2026-09-14):
- Wild empty slots — removed; empty slots count as nothing (pattern evaluated on the tossed coins only)
- Forced 5-coin play — removed; the player freely tosses 1–5 coins per hand

## Deliverables

1. Local web build (`npm run build`) — full 12-blind run playable
2. Source code in this repo (Vite + React + TS)
3. vitest suite (scoring + RNG), 100% passing
4. README with run instructions + seed sharing
