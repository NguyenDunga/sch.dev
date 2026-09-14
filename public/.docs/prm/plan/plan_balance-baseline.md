# Balance Baseline: 50/50

Draft numbers for build start. **Tunable in playtest — changing these is not a scope change** (see [Scope Management Plan](plan_scope_management.md)).

## Pattern Tiers (chips × mult)

A hand scores exactly one tier: the highest-value one it matches (sequence specials overlap count tiers — e.g. HHHHH is also a 4-in-a-row and a triple-run, and scores as Jackpot). The player freely tosses **1–5** coins; **empty slots count as nothing** — the pattern is evaluated on the tossed coins only, so a k-coin play can only match tiers whose structure fits in k coins (4-in-a-row/4-same need 4+, alternating needs exactly 5, triple-run/3-same need 3+). A full 5-coin hand always matches at least one tier; a play of 2 or fewer coins matches no tier (scores 0).

| # | Tier | Example | Chips | Mult | Chance |
| --- | --- | --- | --- | --- | --- |
| 1 | Jackpot (5-same) | HHHHH | 50 | 4 | 6.25% |
| 2 | 4-in-a-row | HHHHT | 40 | 3 | 12.5% |
| 3 | Alternating | HTHTH | 35 | 3 | 6.25% |
| 4 | 4-same | HHTHH | 30 | 2 | 18.75% |
| 5 | Triple-run (3 consecutive same) | HHHTT | 20 | 2 | 18.75% |
| 6 | 3-same | HTHHT | 15 | 1 | 37.5% |

Expected value per hand: **58.44** (exact 1870/32; 10 hands → ~584 per blind vs round-1 small target 300).

> Chance column corrected 2026-09-12 (M2.1): the draft had triple-run 25% / 3-same 31.25% and EV 60.0; enumeration of all 32 hands against the locked tier definitions + priority order gives triple-run 18.75% / 3-same 37.5% and EV 58.4375. Pinned by the exhaustive 32-hand test in `src/core/scoring.test.ts`.

## Blind Targets & Rewards

| Round | Small | Big | Boss | Rewards (S/B/Boss) |
| --- | --- | --- | --- | --- |
| 1 | 300 | 500 | 800 | $4 / $6 / $10 |
| 2 | 600 | 1000 | 1500 | $4 / $6 / $10 |
| 3 | 1000 | 1600 | 2400 | $4 / $6 / $10 |
| 4 | 1500 | 2400 | 3500 | $4 / $6 / $10 |

Starting cash: $4.

## Boss Rules (4 fixed, one per round)

| Round | Rule | Effect |
| --- | --- | --- |
| 1 | No Alternating | Alternating hands score 0 (explicit override — no fall-through to 3-same) |
| 2 | Short Fuse | 8 hands instead of 10 |
| 3 | No Jackpots | 5-same hands score as 4-same (30×2) — even though they match 4-in-a-row |
| 4 | Heavy Target | Target ×1.5, +$5 bonus reward |

## Deck, Hand & Discard (Balatro-style, 2026-09-13 Q&A round 2; phase flow, 2026-09-14 Q&A round 3)

- Base deck: **80** plain 50/50 piggy ceramics (re-tuned 2026-09-14 for the 8-coin hand flow — see Deck Size Calculation below; was 30 for the 5-coin flow, itself reduced from 75); the coin **collection persists for the whole run**
- Purchased special coins are added to the collection (the deck grows beyond the base)
- Start of each blind: the whole collection is reshuffled into the draw pile; the discard pile is cleared
- **Hand size: 8** — each hand draws 8 coins face-down from the draw pile; the player **freely picks 1–5** to play (play size 5)
- **After scoring, all hand coins (tossed + unpicked) go to the discard pile** — gone for the rest of the blind, no circulation (Q&A round 3)
- Within a blind: **no reshuffle** — the draw pile is finite. When it runs out, the hand **shrinks** (fewer coins drawn; empty slots)
- **Empty slots = nothing** (Q&A round 4, 2026-09-14): an empty slot contributes nothing to the pattern — the pattern is evaluated on the tossed coins only (a 3-coin HHH play matches Triple-run, not Jackpot). Wilds were removed: they made playing fewer coins strictly better and broke the tier curve
- **Discard** (play phase, unlimited): the player may discard any coins from the 8-coin hand before confirming the pick
  - Discarding a plain coin → it goes to the discard pile and is **gone for the rest of the blind** (no redraw)
  - Discarding a coin with a **draw enchant** → redraw N fresh coins face-down into the hand (N = enchant tier 1/2/3); the player can then pick them to play
- Re-toss mechanic and the Re-Toss charm: **removed** (superseded by unlimited discard)
- **Hand-size upgrade (shop, new in Q&A round 3)**: a shop offer that raises hand size by 1 (8 → 9 → …). *Draft: price $10, cap 10, no duplicates limit — recalculate in playtest.*
- ⚠️ **Depletion (resolved 2026-09-14 by the Deck Size Calculation below)**: 8 coins leave the draw pile per hand, so the base deck was re-tuned 30 → 80 (all 10 hands full in every 10-hand blind, plus buffer for draw-enchant discard drain). A shrunk hand now scores *lower* (empty slots count as nothing), so deck-out is a penalty, not a power spike
- Note: coin effects, shrunk hands, discard, and the 1–5 pick all shift EV/hand away from the plain 5-coin baseline (58.44) — recalculate in playtest

## Deck Size Calculation (2026-09-14, Q&A round 4 — no-wilds version supersedes the round-3 calculation)

Method: exact enumeration over all face patterns (script kept at `tmp/deck-calc3.mjs`). Assumptions: plain coins only, no discard/effects/charms, face-down, 10 hands per blind, all hand coins leave the draw pile after scoring, optimal play = toss min(5, coins in hand) — EV is monotonically decreasing in coins tossed, so tossing fewer is never EV-positive (the 1–5 freedom serves avoiding negative coin effects like Tax, not pattern math).

EV per hand by coins tossed (k, no wilds — tiers require their full structure length):

| k | 5 | 4 | 3 | 2 | 1 | 0 |
| --- | --- | --- | --- | --- | --- | --- |
| EV | 58.44 | 28.75 | 10.00 | 0 | 0 | 0 |

Per-blind EV by deck size D (10 hands, 8 drawn each):

| D | blind-1 EV | 0-EV hands | weak (<5) hands | hand sizes |
| --- | --- | --- | --- | --- |
| 30 (old) | 233.8 | 6 | 0 | 5 5 5 5 0 0 0 0 0 0 |
| 56 | 409.1 | 3 | 0 | 5×7 0 0 0 |
| 64 | 467.5 | 2 | 0 | 5×8 0 0 |
| 70 | 525.9 | 1 | 0 | 5×9 0 |
| 74 (round-3 pick) | 525.9 | 1 | 0 | 5×9 2 |
| 76 | 554.7 | 0 | 1 | 5×9 4 |
| **78** | **584.4** | **0** | **0** | 5×10 |
| **80 (chosen)** | **584.4** | **0** | **0** | 5×10 |

**Decision: BASE_DECK_SIZE = 80.** Rationale:
1. **All 10 hands full in every 10-hand blind** (10 × 8 = 80 exactly) and in Short Fuse (8 hands) — no dead or weak hands; D = 78 is the all-full minimum, D = 80 adds a buffer of 2 for draw-enchant discard drain (each draw-N discard consumes N extra pile coins; hand 10 needs ≥ 5 and has 8 before drain)
2. **Round-1 margin**: 584.4 vs target 300 = 1.95× — identical to the original 5-coin design's 584/blind baseline, so the existing target curve keeps its intended shape (early blinds clear on base EV; from blind 3 the build must carry)
3. **Shrinking hand is now a pure penalty** (empty slots count as nothing) — deck-out only happens when the player burns the pile with draw-enchant discards, making it a late-game pressure rather than a per-blind feature
4. D ≤ 76 leaves a weak/0-EV final hand in blind 1 (525.9–554.7 vs 584.4); D = 30 was broken (6 dead hands, EV 234 < 300 target)

Playtest watch-items:
- A play of ≤ 2 coins scores 0 — if shrunk hands feel too punishing, levers: deck size ↑ (tuning) or a new low tier for 2-same (scope change)
- The 1–5 free toss is EV-neutral by design (tossing max is always optimal for plain coins) — its value is strategic (avoiding Tax coins, setting up effect combos); watch whether players actually use it

## Coin Effects (v1 core set, 2026-09-13 Q&A round 2)

Effects are **permanent to individual coins** (not charm-dependent). A coin can hold **multiple effects** (via shop merge, no cap). Coin win/loss convention: **Heads = win, Tails = loss**.

| Coin | Effect | Price |
| --- | --- | --- |
| Weight | 75/25 lean toward a fixed face; the favored face is rolled on purchase and fixed for the run | $5 |
| Double-Side | 100/0 fixed face; the face is rolled on purchase | $8 |
| Chaos | random odds (uniform 0–100%) on every flip | $6 |
| Echo | may be flipped twice per hand: after it lands, the player may click the coin to re-flip it once; the final face counts | $7 |
| Magnetic | 75/25 bias toward the face of the coin in the slot to its left (resolved at flip time; no bias if the left slot is empty) | $6 |
| Reverse | inverts the flip result (synergy: merges with Weight/Magnetic to flip their lean) | $5 |
| Tax | +$1 cash per hand while in the hand | $5 |
| Jackpot | 25% chance per hand for +$4 cash | $10 |
| Draw-1 / Draw-2 / Draw-3 | discarding this coin redraws 1 / 2 / 3 coins from the draw pile | $5 / $8 / $12 |

**Face resolution order** (a coin with several face effects, in priority order):
1. **Odds stage** — Magnetic (75% toward left neighbor) > Double-Side (100/0) > Chaos (random 0–100) > Weight (75/25) > base (50/50); the highest-priority odds effect present sets the odds
2. **Roll** the face with the resolved odds
3. **Reverse** — invert the face
4. **Echo** — the player may re-run steps 1–3 once (re-flip)

Cash effects (Tax, Jackpot) pay **cash** at score time, outside the chips × mult score.

**Future content (documented, not built in v1):** Extra (money on a side) · Shapeshift (copies previous coin on heads) · Momentum (streak snowballs) · Interest (money for not flipping) · Gambler (double win/loss) · Mirror (copies opposite of neighbor) · Anchor (syncs neighbor odds) · Parasite (steals value from neighbors) · Conductor (bonus if row matches) · Cursed (high payout, self-destruct chance) · Unstable (random odds shift) · Time Bomb (odds worsen till used) · Phoenix (upgrades after a loss) · Duplicator (chance to clone a coin) · Sacrifice (consume to buff another) · Insurance (partial refund on loss)

## Charm Pool (5)

| Charm | Category | Effect | Price |
| --- | --- | --- | --- |
| +Chips | Scoring booster | +10 chips per hand | $5 |
| +Mult | Scoring booster | +1 mult per hand | $8 |
| Extra Hand | Flip modifier | +1 hand per blind | $10 |
| Payday | Economy | +$5 on blind clear | $5 |
| Jackpot Fever | Pattern booster | Jackpot scores 2× (chips ×2 at its position in charm order) | $12 |

The 3 coin-modifier charms (Weighted Coin / Double-Sided / Always Heads) were removed 2026-09-13 — their role is now filled by per-coin effects. The Re-Toss charm was removed 2026-09-13 (Q&A round 2) — unlimited discard supersedes it.

Shop: 5 offers drawn from a combined pool — the 5 charms (no duplicates of owned charms) + the coin effects (coins may be bought multiple times; each purchase adds one new coin to the collection, with Weight/Double-Side faces rolled on purchase) + the hand-size upgrade (Q&A round 3, draft price $10 / cap 10), 1 free reroll per shop (rerolls all 5 offers). If the pool is exhausted of new charms and the player wants no more coins, the shop offers nothing new.

Shop actions (2026-09-13 Q&A round 2):
- **Merge (sacrifice)** — merge one owned coin into another: the target gains the source coin's effects (stack freely, no cap per coin); the source coin is consumed; free
- **Remove** — delete any coin from the collection; costs $1

Scoring pipeline: see [Scope Statement](plan_scope-statement.md) → Scoring Pipeline.
