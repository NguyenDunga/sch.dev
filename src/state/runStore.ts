import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { createRng, generateSeed, type Rng } from '@/core/rng'
import {
  buildCollection,
  drawFromDeck,
  discardToPile,
  returnHandToPile,
  shuffleCollection,
} from '@/core/deck'
import { resolveFace, scoreHand } from '@/core/scoring'
import { BLINDS, HANDS_PER_BLIND } from '@/core/balance'
import { emptyHand, filledSlot, isFilled, isSome, none, scoreTotal, some } from '@/core/helpers'
import type { Deck, Face, Hand, Option, Phase, Score } from '@/core/types'

/**
 * Legacy vertical-slice hand state (old WBS): 'ready' = the toss window is
 * open, 'tossed' = the window is closed. Replaced by the 5-phase `handPhase`
 * machine (M4, SDD C4) — kept local to the store until then, not a shared type.
 */
type HandState = 'ready' | 'tossed'

const ZERO_TOSSES = [0, 0, 0, 0, 0]

/** The left neighbour's face, or `none` at the left edge / next to an empty slot. */
function leftFace(hand: Hand, slot: number): Option<Face> {
  if (slot <= 0) return none
  const left = hand[slot - 1]
  return isFilled(left) ? some(left.face) : none
}

export interface RunStoreState {
  seed: string
  phase: Phase
  /** 5 slots; empty slots are `{ kind: 'empty' }` until tossed (drawn from the draw pile). */
  hand: Hand
  /** Toss count per slot (initial toss + re-flips + redraws) — drives the coin spin. */
  tosses: number[]
  handState: HandState
  /** Coin collection — finite draw pile within the blind (M2: blind 0 only). */
  deck: Deck
  blindIndex: number
  handsLeft: number
  blindScore: number
  /** Last hand's score for the UI ticker; `none` before the first hand is scored. */
  lastScore: Option<Score>
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
  /** Back to the menu; discards the run. */
  toMenu: () => void
}

/**
 * Run store (WBS 2.3, extended for M3.1 run structure) on the Balatro-style
 * coin deck (2026-09-13 Q&A round 2): 12 blinds (4 rounds × small/big/boss,
 * escalating targets), win/lose → run end. Boss rules (M3.2), charms (M3.3),
 * shop/cash (M3.4), and save/resume (M4) land later.
 *
 * The Rng lives in the closure (it is not serializable). It always holds a
 * valid generator — seeded on `newRun` — and every run action is guarded by
 * `phase === 'run'`, which is only reached after `newRun` seeds it, so there is
 * no null-rng state to check for.
 */
export const createRunStore = () => {
  let rng: Rng = createRng('')

  return create<RunStoreState>()(
    immer((set, get) => {
      /**
       * Start a blind: reset hand/score/hands, reshuffle the whole collection
       * into the draw pile (discard pile cleared). M3.1: 10 hands on every
       * blind (Short Fuse lands with boss rules in M3.2).
       */
      const startBlind = (blindIndex: number) => {
        set({
          phase: 'run',
          hand: emptyHand(5),
          tosses: [...ZERO_TOSSES],
          handState: 'ready',
          deck: shuffleCollection(rng, get().deck),
          blindIndex,
          handsLeft: HANDS_PER_BLIND,
          blindScore: 0,
          lastScore: none,
        })
      }

      return {
        seed: '',
        phase: 'menu',
        hand: emptyHand(5),
        tosses: [...ZERO_TOSSES],
        handState: 'ready',
        deck: { drawPile: [], discardPile: [] },
        blindIndex: 0,
        handsLeft: HANDS_PER_BLIND,
        blindScore: 0,
        lastScore: none,
        won: false,

        newRun: (seed) => {
          const s = seed ?? generateSeed()
          rng = createRng(s)
          set({ seed: s, deck: buildCollection(), won: false })
          startBlind(0)
        },

        tossSlot: (slot) => {
          const s = get()
          if (s.phase !== 'run' || s.handState !== 'ready' || isFilled(s.hand[slot])) return
          const drawn = drawFromDeck(s.deck)
          if (!isSome(drawn)) {
            // Draw pile empty — the hand shrinks to nothing; open the toss window.
            set({ handState: 'tossed' })
            return
          }
          const coin = drawn.value
          const face = resolveFace(rng, coin, leftFace(s.hand, slot))
          const hand = [...s.hand]
          hand[slot] = filledSlot(coin, face)
          const drawPile = s.deck.drawPile.slice(1)
          const allTossed = hand.every(isFilled) || drawPile.length === 0
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
          if (!s.hand.some(isFilled)) return
          set({ handState: 'tossed' })
        },

        echoReflip: (slot) => {
          const s = get()
          if (s.phase !== 'run' || s.handState !== 'tossed') return
          const current = s.hand[slot]
          if (
            !isFilled(current) ||
            !current.coin.effects.some((e) => e.kind === 'echo') ||
            current.echoUsed
          )
            return
          const face = resolveFace(rng, current.coin, leftFace(s.hand, slot))
          const hand = [...s.hand]
          hand[slot] = { ...current, face, echoUsed: true }
          set({
            hand,
            tosses: s.tosses.map((t, i) => (i === slot ? t + 1 : t)),
          })
        },

        discard: (slot) => {
          const s = get()
          if (s.phase !== 'run' || s.handState !== 'tossed') return
          const current = s.hand[slot]
          if (!isFilled(current)) return
          let deck = discardToPile(s.deck, current.coin)
          const hand = [...s.hand]
          hand[slot] = { kind: 'empty' }
          const tosses = [...s.tosses]
          const drawEffect = current.coin.effects.find((e) => e.kind === 'draw')
          if (drawEffect) {
            // Redraw into empty slots: the discarded slot first, then left-to-right.
            const order = [...new Set([slot, 0, 1, 2, 3, 4])].filter((i) => !isFilled(hand[i]))
            let drawn = 0
            for (const target of order) {
              if (drawn >= drawEffect.count) break
              const next = drawFromDeck(deck)
              if (!isSome(next)) break
              const coin = next.value
              hand[target] = filledSlot(coin, resolveFace(rng, coin, leftFace(hand, target)))
              tosses[target] += 1
              deck = { ...deck, drawPile: deck.drawPile.slice(1) }
              drawn += 1
            }
          }
          set({ hand, tosses, deck })
        },

        score: () => {
          const s = get()
          if (s.phase !== 'run' || s.handState !== 'tossed') return
          const result = scoreHand(s.hand, rng)
          // All hand coins → discard pile (gone for the rest of the blind;
          // recycled into the draw pile at the next blind start).
          const deck = returnHandToPile(s.deck, s.hand)
          const blindScore = s.blindScore + scoreTotal(result)
          const handsLeft = s.handsLeft - 1
          set({
            lastScore: some(result),
            hand: emptyHand(5),
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
            } else {
              // Blind cleared → auto-advance to the next blind.
              // (The shop interstitial replaces this in M9/M10.)
              startBlind(s.blindIndex + 1)
            }
          }
        },

        toMenu: () => {
          set({
            seed: '',
            phase: 'menu',
            hand: emptyHand(5),
            tosses: [...ZERO_TOSSES],
            handState: 'ready',
            deck: { drawPile: [], discardPile: [] },
            blindIndex: 0,
            handsLeft: HANDS_PER_BLIND,
            blindScore: 0,
            lastScore: none,
            won: false,
          })
        },
      }
    })
  )
}

export const useRunStore = createRunStore()
