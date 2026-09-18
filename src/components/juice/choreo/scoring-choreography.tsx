// Scoring choreography (13.3) — the 7-beat dopamine loop (SDD UX §6) as a
// purely presentational layer over lastScore (UX §0): it never mutates
// state, never gates an action, and is always skippable — a tap/key
// anywhere snaps to the settled end (beat 7) and changes no number (the
// sequence machine lives in use-scoring-choreography.ts).
//
// Beats: reveal/match (coins pop, the pattern glows) → tier banner slam →
// chips build (flying chips + the chips counter ticking up) → mult flare →
// resolve (chips × mult collide, the total counts up, --primary flash on
// big hits) → cash fly → settle.
//
// Split (150-LOC file rule): choreo-coins.tsx (beats 1–2),
// choreo-flights.tsx (beats 3 + 6 flights), choreo-bursts.tsx (bursts/sfx/
// shake + the big-hit flash); this file composes them.

import type { RefObject } from 'react'
import { none, some } from '@/core/helpers'
import type { TierId } from '@/core/types'
import {
  cashCoinCount,
  chipCount,
  isBigHit,
  matchedIndices,
  TIER_COLOR_VAR,
  type Beat,
  type ChoroSeq,
} from './choreography'
import { ChoreoCoins, TierBanner } from './beats/choreo-coins'
import { CashFlight, ChipFlight } from './beats/choreo-flights'
import { BeatBursts, PrimaryFlash } from './beats/choreo-bursts'

interface ChoroOverlayProps {
  seq: ChoroSeq | null
  beat: Beat
  reduced: boolean
  /** The chips counter (the flying chips' target). */
  chipsRef: RefObject<HTMLElement | null>
  /** The cash counter (the cash coins' target). */
  cashRef: RefObject<HTMLElement | null>
}

/** The fixed celebration layer (UX §6): the coin row, the tier banner, the
 *  flying chips, the big-hit flash, and the cash coins. pointer-events:
 *  none — it never blocks input (UX §0/§9). Rendered at the settled end
 *  (beat 7) as nothing: the numbers rest in the ticker. */
export function ScoringChoreography({ seq, beat, reduced, chipsRef, cashRef }: ChoroOverlayProps) {
  if (!seq || beat < 1 || beat > 6) return null
  const { score, snapshot } = seq
  const tier: TierId | null = score.kind === 'scored' ? score.tier : null
  const coins = snapshot?.coins ?? []
  const matched = matchedIndices(coins, tier ? some(tier) : none)
  const tierColor = tier ? TIER_COLOR_VAR[tier] : null
  return (
    <div className="choreo-layer" aria-hidden>
      <ChoreoCoins coins={coins} matched={matched} tierColor={tierColor} beat={beat} reduced={reduced} />
      {beat >= 2 && beat <= 4 && <TierBanner score={score} beat={beat} tierColor={tierColor} reduced={reduced} />}
      {beat === 3 && !reduced && (
        <ChipFlight
          score={score}
          matched={matched}
          charms={snapshot?.charms ?? []}
          tierColor={tierColor}
          targetRef={chipsRef}
        />
      )}
      {beat === 5 && tier !== null && isBigHit(tier) && <PrimaryFlash />}
      {beat === 6 && !reduced && cashCoinCount(coins) > 0 && <CashFlight coins={coins} targetRef={cashRef} />}
      <BeatBursts
        beat={beat}
        tierColor={tierColor}
        tier={tier}
        chipsRef={chipsRef}
        cashRef={cashRef}
        chipTicks={chipCount(score, matched, snapshot?.charms ?? [])}
        cashTicks={cashCoinCount(coins)}
      />
    </div>
  )
}
