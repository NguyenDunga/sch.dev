import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { createRng, type Rng } from '@/core/rng'
import {
  buildCollection,
  drawFromDeck,
  discardToPile,
  returnHandToPile,
  shuffleCollection,
} from '@/core/deck'
import { resolveFace, scoreHand } from '@/core/scoring'
import { BASE_DECK_SIZE, BLINDS, DRAW_COUNT, HANDS_PER_BLIND } from '@/core/balance'
import type { Deck, HandState, Phase, Score, Slot } from '@/core/types'

const SEED_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

function randomSeed(): string {
  return Array.from(
    { length: 8 },
    () => SEED_CHARS[Math.floor(Math.random() * SEED_CHARS.length)],
  ).join('')
}

const EMPTY_HAND: (Slot | null)[] = [null, null, null, null, null]
const ZERO_TOSSES = [0, 0, 0, 0, 0]

export interface RunState {
  seed: string
  phase: Phase
  /** 5 slots; null until the slot is tossed (drawn from the draw pile). */
  hand: (Slot | null)[]
  /** Toss count per slot (initial toss + re-flips + redraws) — drives the coin spin. */
  tosses: number[]
  handState: HandState
  /** Coin collection — finite draw pile within the blind (M2: blind 0 only). */
  deck: Deck
  blindIndex: number
  handsLeft: number
  blindScore: number
  lastScore: Score | null
  /** Set when the run ends (M2: the single blind is cleared or missed). */
  won: boolean
  /** Start a fresh run (random 8-char seed when omitted). */
  newRun: (seed?: string) => void
  /** Toss one slot: draw a coin from the draw pile and resolve its face. */
  tossSlot: (slot: number) => void
  /**
   * Free 1–5 toss (Q&A round 4, 2026-09-14): open the toss window with 1–5
   * coins already tossed, instead of waiting for all 5 slots / deck-out.
   * No-op with 0 coins tossed or outside the ready state.
   */
  openTossWindow: () => void
  /** Echo re-flip: re-resolve the slot's face once (Echo coins only). */
  echoReflip: (slot: number) => void
  /**
   * Discard the slot's coin (unlimited, toss window): plain coins go to the
   * discard pile (gone for the blind); draw-enchant coins redraw into empty
   * slots starting at the discarded slot (wrapping left-to-right).
   */
  discard: (slot: number) => void
  /** Run the scoring pipeline on the current hand; ends the blind at 0 hands. */
  score: () => void
  /** Round transition: start the next round's small blind (no-op outside the transition). */
  continueRun: () => void
  /** Back to the menu; discards the run. */
  toMenu: () => void
}

/**
 * Run store (WBS 2.3, extended for M3.1 run structure) on the Balatro-style
 * coin deck (2026-09-13 Q&A round 2): 12 blinds (4 rounds × small/big/boss,
 * escalating targets), win/lose → run end. Boss rules (M3.2), charms (M3.3),
 * shop/cash (M3.4), and save/resume (M4) land later.
 * The Rng lives in the closure: it is not serializable.
 */
export const createRunStore = () => {
  let rng: Rng | null = null

  return create<RunState>()(
    immer((set, get) => {
      /**
       * Start a blind: reset hand/score/hands, reshuffle the whole collection
       * into the draw pile (discard pile cleared). M3.1: 10 hands on every
       * blind (Short Fuse lands with boss rules in M3.2).
       */
      const startBlind = (blindIndex: number) => {
        if (!rng) return
        set({
          phase: 'run',
          hand: [...EMPTY_HAND],
          tosses: [...ZERO_TOSSES],
          handState: 'ready',
          deck: shuffleCollection(rng, get().deck),
          blindIndex,
          handsLeft: HANDS_PER_BLIND,
          blindScore: 0,
          lastScore: null,
        })
      }

      return {
      seed: '',
      phase: 'menu',
      hand: [...EMPTY_HAND],
      tosses: [...ZERO_TOSSES],
      handState: 'ready',
      deck: { drawPile: [], discardPile: [] },
      blindIndex: 0,
      handsLeft: HANDS_PER_BLIND,
      blindScore: 0,
      lastScore: null,
      won: false,

      newRun: (seed) => {
        const s = seed ?? randomSeed()
        rng = createRng(s)
        set({ seed: s, deck: buildCollection(BASE_DECK_SIZE), won: false })
        startBlind(0)
      },

      tossSlot: (slot) => {
        const s = get()
        if (s.phase !== 'run' || s.handState !== 'ready' || s.hand[slot] !== null || !rng)
          return
        const coin = drawFromDeck(s.deck)
        if (coin === null) {
          // Draw pile empty — the hand shrinks to nothing; open the toss window.
          set({ handState: 'tossed' })
          return
        }
        const leftFace = slot > 0 ? (s.hand[slot - 1]?.face ?? null) : null
        const face = resolveFace(rng, coin, leftFace)
        const hand = [...s.hand]
        hand[slot] = { coin, face, echoUsed: false }
        const drawPile = s.deck.drawPile.slice(1)
        const allTossed = hand.every((h) => h !== null) || drawPile.length === 0
        set({
          hand,
          tosses: s.tosses.map((t, i) => (i === slot ? t + 1 : t)),
          deck: { ...s.deck, drawPile },
          handState: allTossed ? 'tossed' : 'ready',
        })
      },

      openTossWindow: () => {
        const s = get()
        if (s.phase !== 'run' || s.handState !== 'ready') return
        if (!s.hand.some((h) => h !== null)) return
        set({ handState: 'tossed' })
      },

      echoReflip: (slot) => {
        const s = get()
        if (s.phase !== 'run' || s.handState !== 'tossed' || !rng) return
        const current = s.hand[slot]
        if (current === null || !current.coin.effects.includes('echo') || current.echoUsed)
          return
        const leftFace = slot > 0 ? (s.hand[slot - 1]?.face ?? null) : null
        const face = resolveFace(rng, current.coin, leftFace)
        const hand = [...s.hand]
        hand[slot] = { ...current, face, echoUsed: true }
        set({
          hand,
          tosses: s.tosses.map((t, i) => (i === slot ? t + 1 : t)),
        })
      },

      discard: (slot) => {
        const s = get()
        if (s.phase !== 'run' || s.handState !== 'tossed' || !rng) return
        const current = s.hand[slot]
        if (current === null) return
        let deck = discardToPile(s.deck, current.coin)
        const hand = [...s.hand]
        hand[slot] = null
        const tosses = [...s.tosses]
        const drawEffect = current.coin.effects.find(
          (e): e is 'draw1' | 'draw2' | 'draw3' =>
            e === 'draw1' || e === 'draw2' || e === 'draw3',
        )
        if (drawEffect !== undefined) {
          // Redraw into empty slots: the discarded slot first, then left-to-right.
          const order = [...new Set([slot, 0, 1, 2, 3, 4])].filter((i) => hand[i] === null)
          let drawn = 0
          for (const target of order) {
            if (drawn >= DRAW_COUNT[drawEffect]) break
            const coin = drawFromDeck(deck)
            if (coin === null) break
            const leftFace = target > 0 ? (hand[target - 1]?.face ?? null) : null
            hand[target] = { coin, face: resolveFace(rng, coin, leftFace), echoUsed: false }
            tosses[target] += 1
            deck = { ...deck, drawPile: deck.drawPile.slice(1) }
            drawn += 1
          }
        }
        set({ hand, tosses, deck })
      },

      score: () => {
        const s = get()
        if (s.phase !== 'run' || s.handState !== 'tossed' || !rng) return
        const result = scoreHand(s.hand, rng)
        // All hand coins → discard pile (gone for the rest of the blind;
        // recycled into the draw pile at the next blind start).
        const deck = returnHandToPile(s.deck, s.hand)
        const blindScore = s.blindScore + result.total
        const handsLeft = s.handsLeft - 1
        set({
          lastScore: result,
          hand: [...EMPTY_HAND],
          tosses: [...ZERO_TOSSES],
          // An empty draw pile opens the toss window immediately (empty hand).
          handState: s.deck.drawPile.length === 0 ? 'tossed' : 'ready',
          deck,
          blindScore,
          handsLeft,
        })
        if (handsLeft === 0) {
          const blind = BLINDS[s.blindIndex]
          if (blindScore < blind.target) {
            // Miss → run end (lose).
            set({ phase: 'runEnd', won: false })
          } else if (s.blindIndex === BLINDS.length - 1) {
            // Blind 12 cleared → run end (win).
            set({ phase: 'runEnd', won: true })
          } else if (blind.kind === 'boss') {
            // Boss cleared → round transition screen (next round).
            set({ phase: 'roundTransition' })
          } else {
            // Small/big cleared → auto-advance to the next blind
            // (the shop interstitial lands in M3.4).
            startBlind(s.blindIndex + 1)
          }
        }
      },

      continueRun: () => {
        const s = get()
        if (s.phase !== 'roundTransition') return
        startBlind(s.blindIndex + 1)
      },

      toMenu: () => {
        rng = null
        set({
          seed: '',
          phase: 'menu',
          hand: [...EMPTY_HAND],
          tosses: [...ZERO_TOSSES],
          handState: 'ready',
          deck: { drawPile: [], discardPile: [] },
          blindIndex: 0,
          handsLeft: HANDS_PER_BLIND,
          blindScore: 0,
          lastScore: null,
          won: false,
        })
      },
      }
    })
  )
}

export const useRunStore = createRunStore()
