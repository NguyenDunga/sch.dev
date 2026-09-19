# Component Design: 50/50

Part of the [Software Architecture](software_design_architechture.md). Balance values: [Balance Baseline](../prm/plan/plan_balance-baseline.md).

## Component Inventory

| ID | Component | Layer | WBS milestones |
| --- | --- | --- | --- |
| C1 | RNG wrapper | core | M2 |
| C2 | Balance tables | core | M1 (data filled across M5–M10) |
| C3 | Scoring pipeline (face resolution, tiers, coin cash) | core | M5, M6, M7 |
| C4 | Run store | state | M4, M9, M10, M11, M12 |
| C5 | Menu screen | UI | M12 |
| C6 | Run screen | UI | M12 |
| C7 | Charm bar (drag) | UI | M8, M12 |
| C8 | Shop screen | UI | M9, M12 |
| C9 | Run-end (game over) screen | UI | M12 |
| C10 | Juice (animation, ticker, confetti, SFX) | UI | M13 |
| C11 | Coin deck (collection, draw / discard / reshuffle) | core | M3 |

> WBS milestones are the M0–M15 build breakdown; see [WBS Overview](../prm/plan/plan_wbs-overview.md).

## Core Components

### C1 — RNG wrapper (`src/core/rng.ts`)

```ts
interface Rng {
  next(): number            // [0, 1)
  state(): number[]         // serialize (xoroshiro128plus state)
  restore(s: number[]): void
}
createRng(seed: string): Rng
```

- pure-rand `xoroshiro128plus` seeded from the seed string (6–8 chars) via `xmur3` hash.
- Same seed → identical sequence (unit-tested; charter objective 3).
- **One instance per run.** Every random draw — collection reshuffles, face rolls (toss / echo re-flip), jackpot chance rolls, shop offers, coin purchase rolls — comes from this instance in a fixed order (draw-order contract in [Data Design](software_design_data.md)).
- `state()` / `restore()` support save/resume: the RNG state is serialized with the run, so a resumed run continues the same sequence.

### C2 — Balance tables (`src/core/balance.ts`)

Data-only module, no logic: tier table (6), blind table (12), boss rules (4), charm pool (5), coin-effect pool (9 effect types → 11 catalog entries: 8 single-effect coins + Draw-1/2/3), constants (incl. base deck size 24 = 16 plain + 8 Weight(Heads) — m13a, remove-coin cost, Tax/Jackpot payouts). Values from [balance-baseline](../prm/plan/plan_balance-baseline.md) (m13a redesign values); tuning here is not a scope change.

### C3 — Scoring pipeline (`src/core/scoring.ts`)

Pure functions implementing the locked pipeline ([Scope Statement](../prm/plan/plan_scope-statement.md)):

```ts
resolveFace(rng: Rng, coin: Coin, left: Option<Face>): Face   // coin effects: odds stage → roll → Reverse (Echo re-flip = call again); left = none at the edge / next to an empty slot
matchTier(play: Play, boss: Option<BossRuleId>): Option<TierId>    // empty slots count as nothing; pattern on the tossed coins only (none = no tier matched, e.g. ≤2 coins)
scoreHand(play: Play, boss: Option<BossRuleId>, charms: CharmId[], rng: Rng): Score  // tier → base → boosters → total + coin cash
// Score is a tagged union — a no-tier hand carries no stray chips/mult; a scored hand always has them:
type Score =
  | { kind: 'none'; cash: number }
  | { kind: 'scored'; tier: TierId; chips: number; mult: number; total: number; cash: number }
```

- **Face resolution (toss phase):** odds stage — Magnetic (75% toward left neighbor in the play, if present) > Heads/Tails (100/0 fixed face) > Chaos (random 0–100 odds) > Weight (75/25 toward its favoured face) > base (50/50); roll the face; Reverse inverts it. The favoured face is carried on the coin's `{ kind: 'weight'; favored }` effect variant (no shared `param`). Echo: the player may re-run resolution once per Echo coin (buff phase). **Play-row order:** the play is compacted (no gaps) before toss, so Magnetic's "left neighbour" is always the adjacent picked coin; only slot 0 (or a mid-row empty, which the compaction prevents) yields no bias. Order is player-set via `movePlayCoin` (C4) and decides the adjacency tiers as well as Magnetic.
- **Tier (score phase):** highest-value tier matched (count + sequence tiers; empty slots count as **nothing** — the pattern is evaluated on the tossed coins only, so a k-coin play can only match tiers whose structure fits in k coins; a play of ≤2 coins matches no tier and scores 0). Boss rules applied here: No Alternating → alternating plays score 0 (explicit override, no fall-through); No Jackpots → 5-same scores as 4-same (30×2) — a fixed demotion, **not** a fall-through to the next-highest matched tier (HHHHH also matches 4-in-a-row, but it still scores 4-same).
- **Base:** chips/mult from the tier table.
- **Boosters (buff phase, applied at score):** owned scoring boosters applied left-to-right in charm-bar order: +Chips → chips += 10; +Mult → mult += 1; Jackpot Fever → if tier is Jackpot, chips ×= 2. Under the **No-Jackpots boss** a 5-same is demoted to `fourSame`, so the tier is not `jackpot` and **Jackpot Fever does not fire** that round (intended — the boss neuters jackpot builds).
- **Score:** total = chips × mult.
- **Coin cash:** Tax → +$1 per Tax coin in the play; Jackpot → 25% chance per coin (rng) for +$4. Paid to cash, outside the chips × mult total.

### C4 — Run store (`src/state/runStore.ts`)

Single zustand store (immer + persist). State shape in [Data Design](software_design_data.md). Actions:

| Action | Effect |
| --- | --- |
| `startRun(seed)` | Fresh run: rng from seed, base collection (**24 = 16 plain + 8 Weight(Heads)**, m13a — aligned favored face) built + shuffled into draw pile, round 1 small blind, $4, no charms, handSize 8, phase `run` |
| `drawHand()` | Draw phase (automatic at hand start): **refill the hand up to `handSize`** — unplayed coins kept from the previous hand stay seated (m13a keep-unplayed), the rest drawn face-down from the draw pile (fewer — the remaining slots stay `{ kind: 'empty' }`, never null — when the pile is short); handPhase → `play`. **Empty pile at hand start: auto-skip the hand** — `handsLeft −1`, no score, stays in `draw` (design decision 2026-09-14; prevents a deadlock where an empty hand can never be played) |
| `pickCoin(handIndex)` | Play phase: move the hand coin into the next free play slot (max 5); a coin already in the play is unpicked first |
| `unpickCoin(slotIndex)` | Play phase: return the play coin to the hand |
| `movePlayCoin(from, to)` | Play phase: reorder a coin within the play row (pure array move; the play stays compacted — no gaps). Order decides the adjacency tiers (4-in-a-row / triple-run / alternating) and Magnetic's left-neighbour. Engine hook behind the 13a.5 drag-reorder UI; no-op on same index / out of range / wrong phase (mirrors `moveCharm`) |
| `discard(handIndex)` | Play phase, unlimited: hand coin → discard pile (gone for the blind); if the coin has a draw enchant (draw1/2/3), draw N fresh coins face-down from the draw pile into the hand (empty slots if the pile is short) |
| `confirmPlay()` | Play → toss: the game tosses the picked coins one at a time (C3 `resolveFace` per coin, in play order); handPhase → `buff` |
| `echoReflip(slotIndex)` | Buff phase: if the play coin has Echo and `echoUsed` is false: re-resolve the face (rng); `echoUsed` = true |
| `score()` | Score phase: C3 pipeline (tier → base → boosters → total + coin cash); blindScore += total; cash += coin cash; **only the played (tossed) coins → discard pile — unplayed hand coins stay in the hand** (m13a keep-unplayed, supersedes the Q&A round 3 dump-all rule); handsLeft -= 1; play cleared, handPhase → `draw` (next hand refills around the kept coins); the blind ends **immediately when `blindScore ≥ target`** (leftover hands paid at `LEFTOVER_HAND_BONUS`, m13a.4) or at handsLeft == 0 → `endBlind()` |
| `endBlind()` | Target met: cash += reward (+ Payday $5, + Heavy Target $5, **+ leftover-hand bonus — handsLeft × $1 when the target is met early, m13a.4**); blind 12 → run end (win); else → shop (offers drawn from rng). Target missed: run end (lose) |
| `buy(offer)` | Charm: cash -= price; charm added to bar. Coin: cash -= price; new coin added to the collection (draw pile), Weight's favoured face rolled (rng) into the effect variant. Hand-size: cash -= price; handSize += 1 (cap 10, draft). Offer removed |
| `reroll()` | If the free reroll is unused: regenerate all offers (rng) |
| `mergeCoin(fromId, toId)` | Shop action: `toId` coin gains all of `fromId` coin's effects (stack freely, no cap); `fromId` removed from the collection; free |
| `removeCoin(id)` | Shop action: coin removed from the collection; cash -= $1 |
| `leaveShop()` | Next blind: reset hands (4; 3 on Short Fuse; +1 with Extra Hand — m13a), blind score, hand; **reshuffle the whole collection into the draw pile** (rng), clear discard pile; phase `run` |
| `moveCharm(from, to)` | Reorder `charms` (scoring order) |
| `save()` | Serialize run (incl. rngState + coin collection) to localStorage |
| `resume()` | Restore saved run; reset current-blind progress (or resume at shop, if saved there) |

### C11 — Coin deck (`src/core/deck.ts`)

Pure functions for the coin collection (Balatro-style, 2026-09-13 Q&A round 2):

```ts
buildCollection(): Deck                       // base 24 = 16 plain + 8 Weight(Heads) (fresh run, m13a — aligned favored face)
shuffleCollection(rng: Rng, deck: Deck): Deck // blind start: merge piles → Fisher–Yates → drawPile; discardPile = []
drawFromDeck(deck: Deck): Option<Coin>        // peek draw pile (no rng); none when empty
discardToPile(deck: Deck, coin: Coin): Deck   // coin → discard pile
// returnHandToPile — REMOVED in m13a (keep-unplayed): the played coins are discarded from `play` at
// score; unplayed hand coins stay in the hand and the next hand refills around them.
```

- The collection (drawPile + discardPile) persists for the whole run; special coins bought in the shop are added to it.
- The draw pile is finite within a blind — no reshuffle, no circulation; each hand removes the **played** coins (≤5, m13a keep-unplayed) plus discards, so the drain is ≈23 draws over 4 hands on the 24-deck (all four hands full at base hand size 8, 1-coin buffer — see balance-baseline). **At the hand-size cap (10) the first hand draws 10 and the deck can run out on hand 4** — a graceful shrink, not a crash; scale `BASE_DECK_SIZE` with the cap if that's unwanted (open, balance-baseline). Hands shrink on deck-out (empty slots count as nothing — a shrunk hand scores lower); strategic small plays drain *less*, so they are never punished by deck-out.
- Discarded coins and all post-score **played** coins are gone for the rest of the blind; **unplayed hand coins carry over** (m13a keep-unplayed); the discard pile is cleared at each blind start.
- Coins are identity objects (`Coin.id`) so the collection survives save/resume.

## Run State Machine

```
menu ──startRun──→ run ──target met (any hand) OR hands=0 met, blind<12──→ shop ──leaveShop──→ run (next blind)
                     │        (early clear on a met target pays the leftover hands — m13a.4)
                     ├──target met (any hand) OR hands=0 met, blind=12──→ runEnd (win) ──→ menu
                     │
                     └──hands=0 AND target missed────────────────────────→ runEnd (lose) ──→ menu
```

Phases: `menu | run | shop | runEnd`. The shop appears after every cleared blind except the 12th (which ends the run as a win).

Within `run`, the per-hand phase flow (5 phases, Q&A 2026-09-14 round 3):

1. **Draw** (automatic) — `drawHand()`: the hand is **refilled up to `handSize` (base 8)** — unplayed coins from the previous hand stay seated (m13a keep-unplayed), the rest drawn face-down from the draw pile (fewer, if the pile is short); handPhase `play`
2. **Play** (player) — freely pick **1–5** coins from the hand into the play slots (`pickCoin` / `unpickCoin`); **reorder within the play row** via `movePlayCoin` (order decides the score — adjacency tiers + Magnetic, m13a); **unlimited discard** (`discard`): plain coin → gone for the blind; draw-enchant coin → redraw N fresh coins face-down into the hand; then the player confirms the pick (requires ≥1 coin in the play)
3. **Toss** (automatic) — `confirmPlay()`: the game tosses the picked coins one at a time (animation), each face resolved through its effects; handPhase `buff`
4. **Buff** (player) — each Echo coin may be re-flipped once (tap the coin, `echoReflip`); owned charms (buffs) apply to the tossed coins. **Auto-advance (m13a.1):** when no unused Echo coin is in the play the buff phase has nothing to do and the hand proceeds to scoring without a Score tap; the explicit Score tap remains when a re-flip is available
5. Player taps **Score** (explicit — no auto-score timer, since discards are unlimited) → `score()` → **played coins → discard pile, unplayed hand coins stay in the hand** (m13a keep-unplayed) → handPhase `draw` (next hand) — or `endBlind()` **immediately when the target is met** (leftover hands paid, m13a.4) or at 0 hands. **Auto-advance (m13a.7):** when the score choreography finishes and nothing is left to interact with, the phase auto-ends to the next hand; the Score tap is the explicit fast-forward / early-end. An empty draw pile opens the play phase immediately with an empty hand — the player can only confirm and score 0 (a dead hand).

## UI Components

- **C5 Menu** — title, seed field (6–8 chars) + random-seed button, New Run, Resume (visible only when a save exists).
- **C6 Run screen** — blind header (round, blind name, target, blind score, hands left, draw-pile count), 8-coin hand area (face-down coins with effect badges + **favored-face glyph** (13a.9); **drag a coin to a play slot / the toss zone to pick, drag into the discard well to discard** (m13a — the discard-mode toggle is gone); **multi-select**: Ctrl/Cmd+click toggle, Shift+click range, drag a selected coin moves the whole selection, click-space/Esc clears; plain tap remains the click fallback), 5 play slots (picked coins; **reorder within the row by drag/nudge** — order decides the score; tap to unpick), deck + discard-well piles with pile counts (13.1), **live projected chips×mult as coins land** (13a.7), toss animation for the picked coins, echo re-flip affordance in the buff phase (visible ↻ pip on eligible coins, cleared once used; **auto-advances when no re-flip is available**, 13a.1), explicit **Score** button = fast-forward / early-end (auto-advances when idle, 13a.7), **tier legend** (the 6 patterns + chips×mult, collapsible), charm bar, chips×mult ticker.
- **C7 Charm bar** — dnd-kit sortable row of owned charms in scoring order; drag to reorder; visible on run and shop screens.
- **C8 Shop** — **coin collection first and prominent** (13a.8 — it's the deck the player is building: every coin shows its effects + **favored face**, colorblind-safe glyph + shape; **merge by dragging one coin onto another**, the two-step tap flow remains as fallback; remove $1), then the 5 offer cards (grouped by kind, category color, price, effect one-liner, owned/affordable state), cash, Reroll (labeled "free, once"), Leave (nudge when cash is unspent); hand-size upgrade offer.
- **C9 Run-end (game over)** — win/lose, run summary (blinds cleared, total score, cash), seed displayed for sharing, Menu button.
- **C10 Juice** — coin-toss animation (framer-motion, chosen 2026-09-12 over @formkit/auto-animate), chips×mult ticker (framer-motion), confetti on blind clear (canvas-confetti), SFX via howler (toss, win/lose stingers). No music.

## Component Interactions (one hand, sequence)

1. Hand start → `store.drawHand()` → C11 `drawFromDeck` ×(handSize − kept coins) (face-down, no rng; unplayed coins stay seated — m13a keep-unplayed)
2. Play phase: player drags/taps hand coins → `store.pickCoin(i)` (max 5 into the play; reorder within the row, m13a) / `store.unpickCoin(i)`; discards → `store.discard(i)` → C11 `discardToPile` (+ `drawFromDeck` ×N face-down if the coin has a draw enchant)
3. Player taps **Toss** (was "Confirm", m13a naming) → `store.confirmPlay()` → C3 `resolveFace` per picked coin, in play order (toss animation)
4. Buff phase: player taps an Echo coin → `store.echoReflip(i)` → C3 `resolveFace` again (once per coin); **auto-advances to score when no unused Echo coin is in the play** (m13a.1)
5. Player taps **Score** (fast-forward / early-end) or the phase auto-ends when idle (m13a.7) → `store.score()` → C3 (tier on tossed coins → base → boosters → total + coin cash) → **played (tossed) coins → discard pile; unplayed hand coins stay in the hand** (m13a keep-unplayed) → store updates blindScore / cash / handsLeft
6. UI: coin animation, chips×mult ticker, SFX
7. **Target met (at any point — leftover hands paid)** or handsLeft == 0 → `store.endBlind()` → phase change (shop / run end)
