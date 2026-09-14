# Component Design: 50/50

Part of the [Software Architecture](software_design_architechture.md). Balance values: [Balance Baseline](../prm/plan/plan_balance-baseline.md).

## Component Inventory

| ID | Component | Layer | WBS |
| --- | --- | --- | --- |
| C1 | RNG wrapper | core | 1.3 |
| C2 | Balance tables | core | 2.1 |
| C3 | Scoring pipeline (face resolution, tiers, coin cash) | core | 2.1, 3.2, 3.3, 3.6 |
| C4 | Run store | state | 1.2, 2.3, 3.1–3.4, 3.6, 4.2 |
| C5 | Menu screen | UI | 4.1 |
| C6 | Run screen | UI | 2.2, 3.1, 3.6 |
| C7 | Charm bar (drag) | UI | 3.3 |
| C8 | Shop screen | UI | 3.4 |
| C9 | Run-end (game over) screen | UI | 3.5 |
| C10 | Juice (animation, ticker, confetti, SFX) | UI | 2.2, 4.3 |
| C11 | Coin deck (collection, draw / discard / reshuffle) | core | 3.6 |

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

Data-only module, no logic: tier table (6), blind table (12), boss rules (4), charm pool (5), coin-effect pool (11: 8 effect coins + 3 draw tiers), constants (incl. base deck size 80, remove-coin cost, Tax/Jackpot payouts). Values from [balance-baseline](../prm/plan/plan_balance-baseline.md); tuning here is not a scope change.

### C3 — Scoring pipeline (`src/core/scoring.ts`)

Pure functions implementing the locked pipeline ([Scope Statement](../prm/plan/plan_scope-statement.md)):

```ts
resolveFace(rng: Rng, coin: Coin, leftFace: Face | null): Face   // coin effects: odds stage → roll → Reverse (Echo re-flip = call again)
matchTier(play: Play, boss: BossRule | null): TierId | null         // empty slots count as nothing; pattern on the tossed coins only (null = no tier matched, e.g. ≤2 coins)
scoreHand(play: Play, boss: BossRule | null, charms: CharmId[], rng: Rng): Score  // tier → base → boosters → total + coin cash
interface Score { tier: TierId; chips: number; mult: number; total: number; cash: number }
```

- **Face resolution (toss phase):** odds stage — Magnetic (75% toward left neighbor in the play, if present) > Double-Side (100/0 toward `coin.param`) > Chaos (random 0–100 odds) > Weight (75/25 toward `coin.param`) > base (50/50); roll the face; Reverse inverts it. Echo: the player may re-run resolution once per Echo coin (buff phase).
- **Tier (score phase):** highest-value tier matched (count + sequence tiers; empty slots count as **nothing** — the pattern is evaluated on the tossed coins only, so a k-coin play can only match tiers whose structure fits in k coins; a play of ≤2 coins matches no tier and scores 0). Boss rules applied here: No Alternating → alternating plays score 0 (explicit override, no fall-through); No Jackpots → 5-same demoted to 4-same (30×2).
- **Base:** chips/mult from the tier table.
- **Boosters (buff phase, applied at score):** owned scoring boosters applied left-to-right in charm-bar order: +Chips → chips += 10; +Mult → mult += 1; Jackpot Fever → if tier is Jackpot, chips ×= 2.
- **Score:** total = chips × mult.
- **Coin cash:** Tax → +$1 per Tax coin in the play; Jackpot → 25% chance per coin (rng) for +$4. Paid to cash, outside the chips × mult total.

### C4 — Run store (`src/state/runStore.ts`)

Single zustand store (immer + persist). State shape in [Data Design](software_design_data.md). Actions:

| Action | Effect |
| --- | --- |
| `startRun(seed)` | Fresh run: rng from seed, base collection of 80 plain coins built + shuffled into draw pile, round 1 small blind, $4, no charms, handSize 8, phase `run` |
| `drawHand()` | Draw phase (automatic at hand start): pop up to `handSize` coins face-down from the draw pile into the hand (null when the pile is short); handPhase → `play` |
| `pickCoin(handIndex)` | Play phase: move the hand coin into the next free play slot (max 5); a coin already in the play is unpicked first |
| `unpickCoin(slotIndex)` | Play phase: return the play coin to the hand |
| `discard(handIndex)` | Play phase, unlimited: hand coin → discard pile (gone for the blind); if the coin has a draw enchant (draw1/2/3), draw N fresh coins face-down from the draw pile into the hand (empty slots if the pile is short) |
| `confirmPlay()` | Play → toss: the game tosses the picked coins one at a time (C3 `resolveFace` per coin, in play order); handPhase → `buff` |
| `echoReflip(slotIndex)` | Buff phase: if the play coin has Echo and `echoUsed` is false: re-resolve the face (rng); `echoUsed` = true |
| `score()` | Score phase: C3 pipeline (tier → base → boosters → total + coin cash); blindScore += total; cash += coin cash; **all hand coins (tossed + unpicked) → discard pile**; handsLeft -= 1; hand/play cleared, handPhase → `draw` (next hand); if handsLeft == 0 → `endBlind()` |
| `endBlind()` | Target met: cash += reward (+ Payday $5, + Heavy Target $5); blind 12 → run end (win); else → shop (offers drawn from rng). Target missed: run end (lose) |
| `buy(offer)` | Charm: cash -= price; charm added to bar. Coin: cash -= price; new coin added to the collection (draw pile), Weight/Double-Side `param` rolled (rng). Hand-size: cash -= price; handSize += 1 (cap 10, draft). Offer removed |
| `reroll()` | If the free reroll is unused: regenerate all offers (rng) |
| `mergeCoin(fromId, toId)` | Shop action: `toId` coin gains all of `fromId` coin's effects (stack freely, no cap); `fromId` removed from the collection; free |
| `removeCoin(id)` | Shop action: coin removed from the collection; cash -= $1 |
| `leaveShop()` | Next blind: reset hands (10; 8 on Short Fuse; +1 with Extra Hand), blind score, hand; **reshuffle the whole collection into the draw pile** (rng), clear discard pile; phase `run` |
| `moveCharm(from, to)` | Reorder `charms` (scoring order) |
| `save()` | Serialize run (incl. rngState + coin collection) to localStorage |
| `resume()` | Restore saved run; reset current-blind progress (or resume at shop, if saved there) |

### C11 — Coin deck (`src/core/deck.ts`)

Pure functions for the coin collection (Balatro-style, 2026-09-13 Q&A round 2):

```ts
buildCollection(): Deck                       // base 80 plain coins (fresh run)
shuffleCollection(rng: Rng, deck: Deck): Deck // blind start: merge piles → Fisher–Yates → drawPile; discardPile = []
drawFromDeck(deck: Deck): Coin | null         // pop draw pile (no rng); null when empty
discardToPile(deck: Deck, coin: Coin): Deck   // coin → discard pile
returnHandToPile(deck: Deck, hand: Hand): Deck // after scoring: all hand coins → discard pile (gone for the blind, no circulation)
```

- The collection (drawPile + discardPile) persists for the whole run; special coins bought in the shop are added to it.
- The draw pile is finite within a blind — no reshuffle, no circulation; each hand removes up to `handSize` coins from it (plus discards), so hands shrink as the blind progresses (empty slots count as nothing — a shrunk hand scores lower).
- Discarded plain coins and all post-score hand coins are gone for the rest of the blind; the discard pile is cleared at each blind start.
- Coins are identity objects (`Coin.id`) so the collection survives save/resume.

## Run State Machine

```
menu ──startRun──→ run ──hands=0, target met, blind<12──→ shop ──leaveShop──→ run (next blind)
                     │
                     ├──hands=0, target met, blind=12──→ runEnd (win) ──→ menu
                     │
                     └──hands=0, target missed────────→ runEnd (lose) ──→ menu
```

Phases: `menu | run | shop | runEnd`. The shop appears after every cleared blind except the 12th (which ends the run as a win).

Within `run`, the per-hand phase flow (5 phases, Q&A 2026-09-14 round 3):

1. **Draw** (automatic) — `drawHand()`: up to `handSize` (base 8) coins drawn face-down from the draw pile into the hand (fewer, if the pile is short); handPhase `play`
2. **Play** (player) — freely pick **1–5** coins from the hand into the play slots (`pickCoin` / `unpickCoin`); **unlimited discard** (`discard`): plain coin → gone for the blind; draw-enchant coin → redraw N fresh coins face-down into the hand; then the player confirms the pick (requires ≥1 coin in the play)
3. **Toss** (automatic) — `confirmPlay()`: the game tosses the picked coins one at a time (animation), each face resolved through its effects; handPhase `buff`
4. **Buff** (player) — each Echo coin may be re-flipped once (tap the coin, `echoReflip`); owned charms (buffs) apply to the tossed coins
5. Player taps **Score** (explicit — no auto-score timer, since discards are unlimited) → `score()` → handPhase `draw` (next hand) or `endBlind()` at 0 hands. An empty draw pile opens the play phase immediately with an empty hand — the player can only confirm and score 0 (a dead hand).

## UI Components

- **C5 Menu** — title, seed field (6–8 chars) + random-seed button, New Run, Resume (visible only when a save exists).
- **C6 Run screen** — blind header (round, blind name, target, blind score, hands left, draw-pile count), 8-coin hand area (face-down coins with effect badges; tap to pick into the play), 5 play slots (picked coins; tap to unpick), unlimited discard affordance (tap a hand coin to discard; draw-enchant coins show their redraw count) + discard-pile indicator, toss animation for the picked coins, echo re-flip affordance in the buff phase (tap an unused Echo coin once), explicit **Score** button (no auto-score timer), charm bar, chips×mult ticker.
- **C7 Charm bar** — dnd-kit sortable row of owned charms in scoring order; drag to reorder; visible on run and shop screens.
- **C8 Shop** — 5 offer cards (charms + special coins: name, effect, price), cash, Reroll (1 free), Leave; **Merge** (pick a coin, then a target coin — effects stack, free) and **Remove** (delete a coin, $1) actions; collection view (all owned coins with their effects).
- **C9 Run-end (game over)** — win/lose, run summary (blinds cleared, total score, cash), seed displayed for sharing, Menu button.
- **C10 Juice** — coin-toss animation (framer-motion, chosen 2026-09-12 over @formkit/auto-animate), chips×mult ticker (framer-motion), confetti on blind clear (canvas-confetti), SFX via howler (toss, win/lose stingers). No music.

## Component Interactions (one hand, sequence)

1. Hand start → `store.drawHand()` → C11 `drawFromDeck` ×handSize (face-down, no rng)
2. Play phase: player taps hand coins → `store.pickCoin(i)` (max 5 into the play) / `store.unpickCoin(i)`; discards → `store.discard(i)` → C11 `discardToPile` (+ `drawFromDeck` ×N face-down if the coin has a draw enchant)
3. Player taps **Confirm** → `store.confirmPlay()` → C3 `resolveFace` per picked coin, in play order (toss animation)
4. Buff phase: player taps an Echo coin → `store.echoReflip(i)` → C3 `resolveFace` again (once per coin)
5. Player taps **Score** → `store.score()` → C3 (tier on tossed coins → base → boosters → total + coin cash) → C11 `returnHandToPile` (all hand coins → discard pile) → store updates blindScore / cash / handsLeft
6. UI: coin animation, chips×mult ticker, SFX
7. handsLeft == 0 → `store.endBlind()` → phase change (shop / run end)
