// C4 — Run store: the 5-phase hand state machine (M4).
//
// Per-hand flow (SDD C4 + Run State Machine; Q&A 2026-09-14, round 3):
//   draw → play → toss → buff → score → (draw | endBlind)
// - draw:  drawHand() — pop up to handSize face-down coins (auto)
// - play:  pickCoin / unpickCoin / discard — play 1–5, unlimited discard
// - toss:  confirmPlay() — resolveFace per picked coin in play order (transient)
// - buff:  echoReflip() — one re-flip per Echo coin (boosters apply at score)
// - score: score() — C3 pipeline → blindScore/cash; ALL coins to discard; handsLeft −1
//
// An action fired in the wrong handPhase is a no-op.
//
// The RNG lives in a closure (not serializable); `rngState` mirrors it for
// save/resume (M11). C3: resolveFace (M7), matchTier (M5) + scoreHand (M6) are all real.

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { WritableDraft } from 'immer'
import {
  BLINDS,
  CHARMS,
  COIN_EFFECTS,
  HANDS_PER_BLIND,
  HAND_SIZE,
  HAND_SIZE_CAP,
  HAND_SIZE_PRICE,
  HEAVY_TARGET_BONUS,
  HEAVY_TARGET_MULT,
  PAYDAY_BONUS,
  PLAY_SIZE,
  REMOVE_COIN_COST,
  SHOP_SLOTS,
  SHORT_FUSE_HANDS,
  START_CASH,
} from '@/core/balance'
import {
  buildCollection,
  discardToPile,
  drawFromDeck,
  returnHandToPile,
  shuffleCollection,
} from '@/core/deck'
import { emptyHand, filledSlot, isFilled, none, scoreTotal, some } from '@/core/helpers'
import { createRng, generateSeed } from '@/core/rng'
import type { Rng } from '@/core/rng'
import { resolveFace, scoreHand } from '@/core/scoring'
import type { BossRuleId, Coin, CoinEffect, CoinEffectId, Face, Option, RunState, ShopOffer } from '@/core/types'

/** Placeholder face for face-down coins (hand and pre-toss play slots).
 *  Meaningless until the toss phase resolves the face (SDD C4). */
const FACE_DOWN: Face = 'H'

export interface RunActions {
  /** New run: seed (or generated); fresh rng + shuffled collection; phase 'run', handPhase 'draw'. */
  startRun: (seed?: string) => void
  /** draw → play: pop up to handSize face-down coins into the hand (fewer if the pile is short). */
  drawHand: () => void
  /** play: move a hand coin into the next free play slot (no-op when the play is full). */
  pickCoin: (handIndex: number) => void
  /** play: return a play coin to the first empty hand slot. */
  unpickCoin: (slotIndex: number) => void
  /** play (unlimited): hand coin → discard pile (gone for the blind); draw-enchant coins redraw N face-down. */
  discard: (handIndex: number) => void
  /** play → toss → buff: resolveFace per picked coin in play order (requires ≥1 picked). */
  confirmPlay: () => void
  /** buff: re-run face resolution once for an unused Echo coin in the play. */
  echoReflip: (slotIndex: number) => void
  /** buff → score → draw: C3 pipeline → blindScore/cash; ALL coins to discard; handsLeft −1 (endBlind at 0). */
  score: () => void
  /** shop: toId gains all of fromId's effects (stack freely, no cap); fromId removed from the collection; free. */
  mergeCoin: (fromId: number, toId: number) => void
  /** shop: remove a coin from the collection; cash -= REMOVE_COIN_COST ($1). Delete only — never a refund. */
  removeCoin: (id: number) => void
  /** run/shop: reorder the charms — array order is the charm-bar (scoring) order. */
  moveCharm: (from: number, to: number) => void
  /** shop: if the free reroll is unused, regenerate all offers (rng); rerollUsed = true. */
  reroll: () => void
  /** run/shop: manual save — serialize { version: 2, state } to localStorage (explicit only, no autosave). */
  save: () => void
  /** Restore the saved run; no-op when absent / unparseable / not version 2. */
  resume: () => void
  /**
   * shop → run: next blind — blindIndex +1; reset handsLeft (10; SHORT_FUSE_HANDS on
   * the Short Fuse boss; +1 with Extra Hand), blindScore, hand/play; reshuffle the
   * whole collection into the draw pile (rng), discard cleared.
   */
  leaveShop: () => void
  /**
   * shop: buy an offer — cash -= price; charm → charms (M9.3), coin → collection
   * with rolled favoured face (M9.4), handSize → handSize + 1 (M9.7); the offer
   * is removed. Reject (state unchanged) if broke or the charm is already owned.
   */
  buy: (offer: ShopOffer) => void
  /** UI convenience (C9 Menu button): back to the menu. */
  toMenu: () => void
}

export type RunStore = RunState & RunActions

const SAVE_KEY = 'fifty-fifty-run'
const SAVE_VERSION = 2

/**
 * M9.1: draw SHOP_SLOTS offers from the combined pool — unowned charms + all
 * coin effects (coins may be offered repeatedly across shops) + the hand-size
 * upgrade (while under the cap). Sampled without replacement (Fisher–Yates),
 * so no offer duplicates within one shop and no owned charm is ever offered.
 * The pool is always ≥ 5 (11 coin entries alone), so the shop always fills.
 */
function generateOffers(rng: Rng, charms: RunState['charms'], handSize: number): ShopOffer[] {
  const pool: ShopOffer[] = [
    ...CHARMS.filter((c) => !charms.includes(c.id)).map(
      (c): ShopOffer => ({ kind: 'charm', charm: c.id }),
    ),
    ...COIN_EFFECTS.map((c): ShopOffer => ({ kind: 'coin', effect: c.effect })),
  ]
  if (handSize < HAND_SIZE_CAP) pool.push({ kind: 'handSize' })
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, SHOP_SLOTS)
}

/** Two offers are the same item (structural — the immer draft wraps references). */
function sameOffer(a: ShopOffer, b: ShopOffer): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'handSize' || b.kind === 'handSize') return a.kind === b.kind
  if (a.kind === 'charm' && b.kind === 'charm') return a.charm === b.charm
  return a.kind === 'coin' && b.kind === 'coin' && a.effect === b.effect
}

/** The next free coin id (collection ids are unique: base 0..size-1, purchases append). */
function nextCoinId(deck: RunState['deck']): number {
  return Math.max(...[...deck.drawPile, ...deck.discardPile].map((c) => c.id)) + 1
}

/** A catalog id → the purchased coin's effect variant (M9.4): Weight/Double-Side
 *  roll their favoured face via the rng; Draw-N → { kind: 'draw', count: N }. */
function purchasedEffect(effectId: CoinEffectId, rng: Rng): CoinEffect {
  switch (effectId) {
    case 'weight':
    case 'doubleSide':
      return { kind: effectId, favored: rng.next() < 0.5 ? 'H' : 'T' }
    case 'draw1':
      return { kind: 'draw', count: 1 }
    case 'draw2':
      return { kind: 'draw', count: 2 }
    case 'draw3':
      return { kind: 'draw', count: 3 }
    default:
      return { kind: effectId }
  }
}

/** Blind end (M4 minimal: target check + phase transition). M10 adds rewards,
 *  boss rules, and round progression. Called by score() when handsLeft hits 0. */
function endBlind(st: WritableDraft<RunState>, rng: Rng) {
  const blind = BLINDS[st.blindIndex]
  // Heavy Target: the table target is ×1.5 at runtime (SDD data — 3500 → 5250).
  const isHeavy = blind.kind === 'boss' && blind.rule === 'heavyTarget'
  const target = isHeavy ? blind.target * HEAVY_TARGET_MULT : blind.target
  if (st.blindScore >= target) {
    // Reward: base + Payday charm + Heavy Target bonus.
    st.cash +=
      blind.reward + (st.charms.includes('payday') ? PAYDAY_BONUS : 0) + (isHeavy ? HEAVY_TARGET_BONUS : 0)
    if (st.blindIndex >= BLINDS.length - 1) {
      st.phase = 'runEnd'
      st.won = true
    } else {
      st.phase = 'shop'
      st.shop = {
        offers: generateOffers(rng, st.charms, st.handSize),
        rerollUsed: false,
      }
    }
  } else {
    st.phase = 'runEnd'
    st.won = false
  }
}

export function createRunStore() {
  let rng = createRng('')
  return create<RunStore>()(
    immer((set, get) => ({
      // -- initial state: menu, no run in progress --
      seed: '',
      phase: 'menu',
      round: 1,
      blindIndex: 0,
      hand: emptyHand(HAND_SIZE),
      play: emptyHand(PLAY_SIZE),
      handPhase: 'draw',
      handSize: HAND_SIZE,
      handsLeft: HANDS_PER_BLIND,
      blindScore: 0,
      cash: 0,
      charms: [],
      deck: { drawPile: [], discardPile: [] },
      shop: { offers: [], rerollUsed: false },
      lastScore: none,
      runScore: 0,
      won: false,
      rngState: [],

      startRun: (seedArg) => {
        const seed = seedArg ?? generateSeed()
        rng = createRng(seed)
        set((st) => {
          st.seed = seed
          st.phase = 'run'
          st.round = 1
          st.blindIndex = 0
          st.hand = emptyHand(HAND_SIZE)
          st.play = emptyHand(PLAY_SIZE)
          st.handPhase = 'draw'
          st.handSize = HAND_SIZE
          st.handsLeft = HANDS_PER_BLIND
          st.blindScore = 0
          st.cash = START_CASH
          st.charms = []
          st.deck = shuffleCollection(rng, buildCollection())
          st.shop = { offers: [], rerollUsed: false }
          st.lastScore = none
          st.runScore = 0
          st.won = false
          st.rngState = rng.state()
        })
      },

      drawHand: () =>
        set((st) => {
          if (st.phase !== 'run' || st.handPhase !== 'draw') return
          for (let i = 0; i < st.hand.length; i++) {
            if (st.hand[i].kind !== 'empty') continue
            const d = drawFromDeck(st.deck)
            if (!d.some) break
            st.hand[i] = filledSlot(d.value, FACE_DOWN)
            st.deck.drawPile = st.deck.drawPile.slice(1)
          }
          if (!st.hand.some(isFilled)) {
            // Empty pile at hand start: auto-skip the hand (no score), handsLeft −1,
            // back to draw (design decision 2026-09-14 — the SDD was silent here).
            st.handsLeft -= 1
            if (st.handsLeft <= 0) endBlind(st, rng)
            return
          }
          st.handPhase = 'play'
        }),

      pickCoin: (handIndex) =>
        set((st) => {
          if (st.phase !== 'run' || st.handPhase !== 'play') return
          const slot = st.hand[handIndex]
          if (!slot || slot.kind !== 'filled') return
          const target = st.play.findIndex((p) => p.kind === 'empty')
          if (target === -1) return // play full (5) — no-op
          st.play[target] = slot
          st.hand[handIndex] = { kind: 'empty' }
        }),

      unpickCoin: (slotIndex) =>
        set((st) => {
          if (st.phase !== 'run' || st.handPhase !== 'play') return
          const slot = st.play[slotIndex]
          if (!slot || slot.kind !== 'filled') return
          const target = st.hand.findIndex((h) => h.kind === 'empty')
          if (target === -1) return // hand full — no-op
          st.hand[target] = slot
          st.play[slotIndex] = { kind: 'empty' }
        }),

      discard: (handIndex) =>
        set((st) => {
          if (st.phase !== 'run' || st.handPhase !== 'play') return
          const slot = st.hand[handIndex]
          if (!slot || slot.kind !== 'filled') return
          const coin = slot.coin
          st.hand[handIndex] = { kind: 'empty' }
          st.deck = discardToPile(st.deck, coin)
          // Draw-enchant coin: redraw N face-down into empty hand slots (discarded slot first).
          const draw = coin.effects.find((e) => e.kind === 'draw')
          if (draw && draw.kind === 'draw') {
            const order = [
              handIndex,
              ...st.hand.map((_, i) => i).filter((i) => i !== handIndex && st.hand[i].kind === 'empty'),
            ]
            let n = draw.count
            for (const i of order) {
              if (n <= 0) break
              const d = drawFromDeck(st.deck)
              if (!d.some) break
              st.hand[i] = filledSlot(d.value, FACE_DOWN)
              st.deck.drawPile = st.deck.drawPile.slice(1)
              n--
            }
          }
        }),

      confirmPlay: () => {
        const st = get()
        if (st.phase !== 'run' || st.handPhase !== 'play') return
        if (!st.play.some(isFilled)) return // requires ≥1 coin in the play
        // Step 1: play → toss (observable — the UI plays the toss animation here).
        set((s) => {
          s.handPhase = 'toss'
        })
        // Step 2: toss → buff — resolve each picked coin's face in play order
        // (left → right); the left neighbour's face is already resolved (SDD C4).
        set((s) => {
          s.play.forEach((slot, i) => {
            if (slot.kind !== 'filled') return
            const prev = i > 0 ? s.play[i - 1] : undefined
            const left: Option<Face> = prev && prev.kind === 'filled' ? some(prev.face) : none
            slot.face = resolveFace(rng, slot.coin, left)
          })
          s.handPhase = 'buff'
          s.rngState = rng.state()
        })
      },

      echoReflip: (slotIndex) =>
        set((st) => {
          if (st.phase !== 'run' || st.handPhase !== 'buff') return
          const slot = st.play[slotIndex]
          if (!slot || slot.kind !== 'filled' || slot.echoUsed) return
          if (!slot.coin.effects.some((e) => e.kind === 'echo')) return
          const prev = slotIndex > 0 ? st.play[slotIndex - 1] : undefined
          const left: Option<Face> = prev && prev.kind === 'filled' ? some(prev.face) : none
          slot.face = resolveFace(rng, slot.coin, left)
          slot.echoUsed = true
          st.rngState = rng.state()
        }),

      score: () => {
        const st = get()
        if (st.phase !== 'run' || st.handPhase !== 'buff') return
        // Step 1: buff → score (observable — the UI runs the chips×mult ticker here).
        set((s) => {
          s.handPhase = 'score'
        })
        // Step 2: score → draw — C3 pipeline, then all coins to the discard pile.
        set((s) => {
          const blind = BLINDS[s.blindIndex]
          const boss: Option<BossRuleId> = blind.kind === 'boss' ? some(blind.rule) : none
          const result = scoreHand(s.play, boss, s.charms, rng)
          // ALL hand coins (tossed + unpicked) → discard pile (gone for the blind).
          s.deck = returnHandToPile(s.deck, s.hand)
          s.play.forEach((slot) => {
            if (slot.kind === 'filled') s.deck = discardToPile(s.deck, slot.coin)
          })
          s.blindScore += scoreTotal(result)
          s.cash += result.cash
          s.handsLeft -= 1
          s.lastScore = some(result)
          s.hand = emptyHand(s.handSize)
          s.play = emptyHand(PLAY_SIZE)
          s.rngState = rng.state()
          s.handPhase = 'draw'
          if (s.handsLeft <= 0) endBlind(s, rng)
        })
      },

      mergeCoin: (fromId, toId) =>
        set((st) => {
          if (st.phase !== 'shop') return
          if (fromId === toId) return
          const collection = [...st.deck.drawPile, ...st.deck.discardPile]
          const from = collection.find((c) => c.id === fromId)
          const to = collection.find((c) => c.id === toId)
          if (!from || !to) return
          // Target gains all of the source's effects (stack freely, no cap);
          // the source is removed from the collection. Free.
          to.effects = [...to.effects, ...from.effects]
          st.deck.drawPile = st.deck.drawPile.filter((c) => c.id !== fromId)
          st.deck.discardPile = st.deck.discardPile.filter((c) => c.id !== fromId)
        }),

      moveCharm: (from, to) =>
        set((st) => {
          if (st.phase !== 'run' && st.phase !== 'shop') return
          if (from === to || from < 0 || to < 0 || from >= st.charms.length || to >= st.charms.length)
            return
          const charms = [...st.charms]
          const [moved] = charms.splice(from, 1)
          charms.splice(to, 0, moved)
          st.charms = charms
        }),

      reroll: () =>
        set((st) => {
          if (st.phase !== 'shop' || st.shop.rerollUsed) return
          st.shop.offers = generateOffers(rng, st.charms, st.handSize)
          st.shop.rerollUsed = true
          st.rngState = rng.state()
        }),

      buy: (offer) =>
        set((st) => {
          if (st.phase !== 'shop') return
          const price =
            offer.kind === 'charm'
              ? CHARMS.find((c) => c.id === offer.charm)?.price
              : offer.kind === 'coin'
                ? COIN_EFFECTS.find((c) => c.effect === offer.effect)?.price
                : HAND_SIZE_PRICE
          if (price === undefined || st.cash < price) return // broke — reject
          if (offer.kind === 'charm' && st.charms.includes(offer.charm)) return // owned — reject (9.8)
          if (offer.kind === 'handSize' && st.handSize >= HAND_SIZE_CAP) return // cap — reject (9.7)
          st.cash -= price
          if (offer.kind === 'charm') {
            st.charms.push(offer.charm)
          } else if (offer.kind === 'coin') {
            // M9.4: new coin joins the collection (draw pile) with its effect variant;
            // Weight/Double-Side roll their favoured face now, fixed for the run.
            const coin: Coin = { id: nextCoinId(st.deck), effects: [purchasedEffect(offer.effect, rng)] }
            st.deck.drawPile = [...st.deck.drawPile, coin]
            st.rngState = rng.state()
          } else {
            // M9.7: hand-size upgrade — +1 slot, up to HAND_SIZE_CAP.
            st.handSize += 1
          }
          // Remove the bought offer (structurally — the draft wraps the passed object).
          st.shop.offers = st.shop.offers.filter((o) => !sameOffer(o, offer))
        }),

      removeCoin: (id) =>
        set((st) => {
          if (st.phase !== 'shop') return
          if (st.cash < REMOVE_COIN_COST) return // broke — reject
          const inDraw = st.deck.drawPile.some((c) => c.id === id)
          const inDiscard = st.deck.discardPile.some((c) => c.id === id)
          if (!inDraw && !inDiscard) return // unknown coin — no-op
          st.deck.drawPile = st.deck.drawPile.filter((c) => c.id !== id)
          st.deck.discardPile = st.deck.discardPile.filter((c) => c.id !== id)
          st.cash -= REMOVE_COIN_COST
        }),

      leaveShop: () =>
        set((st) => {
          if (st.phase !== 'shop') return
          st.blindIndex += 1
          const next = BLINDS[st.blindIndex]
          st.round = next.round
          const baseHands =
            next.kind === 'boss' && next.rule === 'shortFuse' ? SHORT_FUSE_HANDS : HANDS_PER_BLIND
          st.handsLeft = baseHands + (st.charms.includes('extraHand') ? 1 : 0)
          st.blindScore = 0
          st.hand = emptyHand(st.handSize)
          st.play = emptyHand(PLAY_SIZE)
          // Whole collection (draw + discard) → shuffled draw pile; discard cleared.
          st.deck = shuffleCollection(rng, st.deck)
          st.shop = { offers: [], rerollUsed: false }
          st.rngState = rng.state()
          st.phase = 'run'
          st.handPhase = 'draw'
        }),

      save: () => {
        const st = get()
        if (st.phase !== 'run' && st.phase !== 'shop') return // nothing to save outside a run
        localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, state: st }))
      },

      resume: () => {
        const raw = localStorage.getItem(SAVE_KEY)
        if (raw === null) return // no save — no-op (the menu hides the Resume button)
        let saved: { version?: unknown; state?: RunState }
        try {
          saved = JSON.parse(raw)
        } catch {
          return // parse-fail — no-op
        }
        // v1 saves predate the coin collection: not migratable, discarded.
        if (saved.version !== SAVE_VERSION || saved.state === undefined) return
        const s = saved.state
        if (s.phase !== 'run' && s.phase !== 'shop') return // nothing resumable
        // The run continues the same sequence: restore the RNG before any draw.
        rng.restore(s.rngState)
        set((st) => {
          // Preserved: seed, round/blind, cash, charms + order, collection, rngState, runScore.
          st.seed = s.seed
          st.round = s.round
          st.blindIndex = s.blindIndex
          st.cash = s.cash
          st.charms = s.charms
          st.deck = s.deck
          st.handSize = s.handSize
          st.runScore = s.runScore
          st.rngState = s.rngState
          // Reset: hand, play, handPhase, lastScore, current-blind progress.
          st.hand = emptyHand(st.handSize)
          st.play = emptyHand(PLAY_SIZE)
          st.handPhase = 'draw'
          st.lastScore = none
          st.blindScore = 0
          st.phase = s.phase
          if (s.phase === 'run') {
            // Blind start: reset the hand budget and re-reshuffle the whole collection
            // from the restored rngState (discard cleared) — SDD resume semantics.
            const blind = BLINDS[s.blindIndex]
            const baseHands =
              blind.kind === 'boss' && blind.rule === 'shortFuse' ? SHORT_FUSE_HANDS : HANDS_PER_BLIND
            st.handsLeft = baseHands + (s.charms.includes('extraHand') ? 1 : 0)
            st.deck = shuffleCollection(rng, st.deck)
            st.shop = { offers: [], rerollUsed: false }
          } else {
            // M11.4: shop — offers regenerated identically from the restored rngState.
            st.shop = { offers: [], rerollUsed: false }
          }
          st.rngState = rng.state()
        })
      },

      toMenu: () =>
        set((st) => {
          st.phase = 'menu'
        }),
    })),
  )
}

/** The app-wide store instance. */
export const useRunStore = createRunStore()
