# Balance Baseline: 50/50

Draft numbers for build start. **Tunable in playtest — changing these is not a scope change** (see [Scope Management Plan](plan_scope_management.md)).

> **m13a rebalance (2026-09-15):** this doc now reflects the m13a pattern — **4 hands per blind**, a small **mixed starter deck** (50/50 + 75/25), **keep-unplayed coins**, and **halved targets**. The 10-hand / 80-coin figures below were the pre-m13a baseline and are preserved only in the Change Log. Method: exact enumeration (plain 50/50) + Monte-Carlo (mixed deck, keep-unplayed blind) — scripts kept at `tmp/balance-m13a.mjs` / `-2.mjs`.

## Pattern Tiers (chips × mult)

A hand scores exactly one tier: the highest-value one it matches (sequence specials overlap count tiers — e.g. HHHHH is also a 4-in-a-row and a triple-run, and scores as Jackpot). The player freely tosses **1–5** coins; **empty slots count as nothing** — the pattern is evaluated on the tossed coins only, so a k-coin play can only match tiers whose structure fits in k coins (4-in-a-row/4-same need 4+, alternating needs exactly 5, triple-run/3-same need 3+). A full 5-coin hand always matches at least one tier; a play of 2 or fewer coins matches no tier (scores 0).

**The tier table is unchanged by m13a** — only the *odds* shift, because the mixed deck's 75/25 coins land their favored face more often (quantified below). The Chance column here is the plain-50/50 baseline (pinned by the 32-hand test in `scoring.test.ts`).

| # | Tier | Example | Chips | Mult | Chance (plain 50/50) |
| --- | --- | --- | --- | --- | --- |
| 1 | Jackpot (5-same) | HHHHH | 50 | 4 | 6.25% |
| 2 | 4-in-a-row | HHHHT | 40 | 3 | 12.5% |
| 3 | Alternating | HTHTH | 45 | 4 | 6.25% |
| 4 | 4-same | HHTHH | 30 | 2 | 18.75% |
| 5 | Triple-run (3 consecutive same) | HHHTT | 20 | 2 | 18.75% |
| 6 | 3-same | HTHHT | 15 | 1 | 37.5% |

EV per hand (plain 50/50): **63.13** (exact 2020/32; raised from 58.44 / 1870/32 when Alternating went 35×3 → 45×4 in the 2026-09-16 balance pass). With the mixed starter deck the naive EV/hand ≈ **62** (skilled ≈ 69), so per-blind base EV over 4 hands ≈ **255** vs the round-1 small target 150. The odds shift with aligned Heads coins: jackpot rate ~6% → ~11% (skilled). **Critical:** 75/25 coins only help if their favored face is *aligned* — random/opposing favored faces cancel under a face-down draw and collapse EV back to the 63.1 baseline, which is why the 8 starter Weight coins all favor Heads.

## Blind Targets & Rewards (m13a — halved from the 10-hand baseline)

| Round | Small | Big | Boss | Rewards (S/B/Boss) |
| --- | --- | --- | --- | --- |
| 1 | 150 | 250 | 400 | $4 / $6 / $10 |
| 2 | 300 | 500 | 750 | $4 / $6 / $10 |
| 3 | 500 | 800 | 1200 | $4 / $6 / $10 |
| 4 | 750 | 1200 | 1750 | $4 / $6 / $10 |

Starting cash: $4. The whole table is a constant 0.5× scale of the pre-m13a targets, so the difficulty *shape* is unchanged (round 1 is a warm-up; from blind 3 the build must carry). Heavy Target still multiplies its boss target ×1.5 at runtime (1750 → 2625).

## Boss Rules (4 fixed, one per round)

| Round | Rule | Effect |
| --- | --- | --- |
| 1 | No Alternating | Alternating hands score 0 (explicit override — no fall-through to 3-same) |
| 2 | Short Fuse | **3 hands instead of 4** (m13a — was 8 of 10) |
| 3 | No Jackpots | 5-same hands score as 4-same (30×2) — even though they match 4-in-a-row |
| 4 | Heavy Target | Target ×1.5, +$5 bonus reward |

## Deck, Hand & Discard (m13a — keep-unplayed, 2026-09-15)

- Base deck: **24 = 16 plain 50/50 + 8 Weight coins favoring Heads** (was 80 all-plain; aligned-Heads because opposing favored faces cancel, and 24 because keep-unplayed covers 4 hands — see below). The coin **collection persists for the whole run**.
- Purchased special coins are added to the collection (the deck grows beyond the base).
- Start of each blind: the whole collection is reshuffled into the draw pile; the discard pile is cleared.
- **Hands per blind: 4** (was 10) — each blind is 4 hands; Short Fuse boss = 3.
- **Hand size: 8** — each hand draws face-down up to 8 coins from the draw pile; the player **freely picks 1–5** to play (play size 5).
- **Keep-unplayed (m13a):** after scoring, only the **played** coins go to the discard pile; **unplayed hand coins stay in the hand** and the next hand refills to hand size around them. (Was: all hand coins dumped after scoring.) This is why the deck could shrink from 80 to 24 — coins are no longer thrown away 8-at-a-time.
- Within a blind: **no reshuffle** — the draw pile is finite. When it runs out, the hand refills with fewer coins (empty slots).
- **Empty slots = nothing:** an empty slot contributes nothing to the pattern (a 3-coin HHH play matches Triple-run, not Jackpot). Wilds were removed — they made playing fewer coins strictly better and broke the tier curve.
- **Discard** (play phase, unlimited): the player may discard any coins from the hand before confirming the pick — via the discard drop-zone / bin (m13a; replaces the discard-mode toggle).
  - Discarding a plain coin → it goes to the discard pile and is **gone for the rest of the blind** (no redraw).
  - Discarding a coin with a **draw enchant** → redraw N fresh coins face-down into the hand (N = enchant tier 1/2/3).
- **Hand-size upgrade (shop):** a shop offer that raises hand size by 1 (8 → 9 → …). *Draft: price $10, cap 10 — recalculate in playtest.*
- **Early-clear payout (m13a):** clearing the target before hand 4 ends the blind and pays a bonus per unused hand (*draft +$1/hand*) — see WBS 13a.4.

## Deck Size Calculation (m13a — keep-unplayed, supersedes the 10-hand no-wilds calc)

Method: Monte-Carlo over the mixed deck + a keep-unplayed multi-hand blind (scripts `tmp/balance-m13a.mjs` / `-2.mjs`).

Drain per blind (keep-unplayed, 4 hands, draw-to-8, play 5): hand 1 draws 8, hands 2–4 refill 3→8 (draw 5 each) = **23 of 24 drawn**, all four hands full with a 1-coin buffer. Playing fewer than 5 keeps more and drains less, so strategic small plays never cause deck-out (the opposite of the old empty-slot penalty). Draw-enchant discards are the only extra drain; bump to 26–28 if heavy draw builds deck-out in playtest.

⚠️ **Hand-size upgrades break the "all hands full" buffer.** The 23-draw figure assumes base hand size 8. At the cap (10), hand 1 draws 10 and the drain becomes 10+5+5+5 = **25 > 24**, so the deck runs out on hand 4 (a graceful shrink, not a crash). **Open decision:** either scale `BASE_DECK_SIZE` with `HAND_SIZE_CAP` (≈ cap + 3×PLAY_SIZE = 25 → deck 26), or accept a small late-blind deck-out as the cost of upgrading. Decide before locking the deck size.

Per-blind base EV: plain ≈ 234, recommended mixed starter ≈ **255**, spicy (12 plain + 12 Weight-H) ≈ 284. Round-1 small (150) vs 255 = 1.7× headroom — a clear but non-trivial warm-up.

**Critical finding:** 75/25 coins only spice the game if their favored face is **aligned**. Random/opposing favored faces cancel under a face-down draw and collapse EV back to the 63.1 baseline — hence the starter's 8 Weight coins all favor **Heads** (matches the "Heads = win" convention) and each coin's favored face must be visible (WBS 13a.9).

## Coin Effects (v1 core set, 2026-09-13 Q&A round 2)

Effects are **permanent to individual coins** (not charm-dependent). A coin can hold **multiple effects** (via shop merge, no cap). Coin win/loss convention: **Heads = win, Tails = loss**.

| Coin | Effect | Price |
| --- | --- | --- |
| Weight | 75/25 lean toward a fixed face; the favored face is rolled on purchase and fixed for the run | $5 |
| Heads | always lands on Heads (100/0 fixed) | $8 |
| Tails | always lands on Tails (100/0 fixed) | $8 |
| Chaos | random odds (uniform 0–100%) on every flip | $6 |
| Echo | may be flipped twice per hand: after it lands, the player may click the coin to re-flip it once; the final face counts | $7 |
| Magnetic | 75/25 bias toward the face of the coin in the slot to its left (resolved at flip time; no bias if the left slot is empty) | $6 |
| Reverse | inverts the flip result (synergy: merges with Weight/Magnetic to flip their lean) | $5 |
| Tax | +$1 cash per hand while in the hand | $5 |
| Jackpot | 25% chance per hand for +$4 cash | $10 |
| Draw-1 / Draw-2 / Draw-3 | discarding this coin redraws 1 / 2 / 3 coins from the draw pile | $5 / $8 / $12 |

**Face resolution order** (a coin with several face effects, in priority order):
1. **Odds stage** — Magnetic (75% toward left neighbor) > Heads/Tails (100/0 fixed) > Chaos (random 0–100) > Weight (75/25) > base (50/50); the highest-priority odds effect present sets the odds
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
| Extra Hand | Flip modifier | +1 hand per blind | **$15** (13a.11 playtest: $10→$15 — +1 of 4 hands ≈ +5–9pp clear rate on mid-difficulty blinds; the only charm that adds a full hand of EV) |
| Payday | Economy | +$5 on blind clear | $5 |
| Jackpot Fever | Pattern booster | Jackpot scores 2× (chips ×2 at its position in charm order) | $12 |

The 3 coin-modifier charms (Weighted Coin / Double-Sided / Always Heads) were removed 2026-09-13 — their role is now filled by per-coin effects. The Re-Toss charm was removed 2026-09-13 (Q&A round 2) — unlimited discard supersedes it.

## Pattern (Tier) Upgrades (M22, 2026-09-19)

The scoring patterns (tiers) are upgradable in the shop, like Balatro's Jokers. Each upgrade targets ONE tier and boosts its chips or mult; it persists for the whole run (like a charm) and stacks (no cap). Fixed cost + fixed value (no per-level scaling).

| Upgrade | Effect | Cost |
| --- | --- | --- |
| +Chips (per tier) | +10 chips to that tier | $8 |
| +Mult (per tier) | +1 mult to that tier | $8 |

Impact: a +10-chips upgrade is worth +10 × (the tier's effective mult); a +1-mult upgrade is worth +1 × (the tier's effective chips). On a base tier both land in the +10…+50 total range (e.g. +10 chips on Jackpot = +40; +1 mult on Jackpot = +50), so the two are comparable. Upgrades apply **before** the charm boosters, so a `+Mult` charm multiplies the upgraded chips too (Balatro-style compounding). The shop pool gains 12 entries (6 tiers × chips/mult); the shop still draws 5 without replacement.

Shop: 5 offers drawn from a combined pool — the 5 charms (no duplicates of owned charms) + the coin effects (coins may be bought multiple times; each purchase adds one new coin to the collection, with Weight's favored face rolled on purchase) + the 12 pattern upgrades (M22) + the hand-size upgrade (draft price $10 / cap 10), 1 free reroll per shop (rerolls all 5 offers). With the 24-coin base deck, a bought coin is ~4% of the collection (vs ~1.2% at 80) — it appears ~3× as often, so upgrades matter (the m13a goal).

Shop actions (2026-09-13 Q&A round 2):
- **Merge (sacrifice)** — merge one owned coin into another: the target gains the source coin's effects (stack freely, no cap per coin); the source coin is consumed; free
- **Remove** — delete any coin from the collection; costs $1

Scoring pipeline: see [Scope Statement](plan_scope-statement.md) → Scoring Pipeline.

## Change Log

| Date | Change | Reason |
| --- | --- | --- |
| 2026-09-12 | Chance column corrected (M2.1): triple-run 18.75% / 3-same 37.5%, EV 58.4375 (was 25% / 31.25% / 60.0) — pinned by the exhaustive 32-hand test | Enumeration vs the locked tier priority |
| 2026-09-14 | Pre-m13a baseline: 10 hands/blind; base deck **80** all-plain (10 × 8, all hands full); Short Fuse **8**; targets 300/500/800 … 1500/2400/3500; **all hand coins dumped to discard after scoring**; per-blind EV 584 @ 1.95× round-1 | 8-coin hand flow, no-wilds deck calc (Q&A round 4) |
| 2026-09-15 | **m13a rebalance:** 4 hands/blind; base deck **24 = 16 plain + 8 Weight(Heads)**; Short Fuse **3**; targets **halved** (150/250/400 … 750/1200/1750); **keep-unplayed** (only played coins discarded); early-clear payout; mixed-deck odds (scripts `tmp/balance-m13a.mjs`) | Rebalance for a faster, weightier loop where upgrades matter (WBS m13a) |
| 2026-09-16 | **13a.11 hand-economy re-tune:** Extra Hand **$10 → $15** (playtest: +1 hand ≈ +5–9pp clear rate on mid blinds, 1.4–3× on the hard ones — worth more than $10). Short Fuse **stays at 3 hands**: the round-2 boss (750) has a structural wall — 3×200 (max tier) = 600 < 750, so 3 hands can't clear it without boosters (4×200 = 800 is the only no-booster path); with a booster it's a jackpot-gate (1.3% with Jackpot-Fever + 4 Weight-H), not impossible. The boss's difficulty is set by the target, not the hand count. Playtest: `src/core/playtest-13a11.test.ts` | WBS 13a.11 — re-price so neither hand-economy option dominates |
| 2026-09-16 | **Alternating tier raised 35×3 → 45×4** (180, 90% of Jackpot's 200 — "almost as good as a jackpot"). Plain-50/50 EV/hand **58.44 → 63.13** (1870/32 → 2020/32). The tier table's other rows are unchanged | WBS M21 — make a perfect alternating hand a near-jackpot reward |
