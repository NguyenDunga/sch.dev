// C6 (partial — 12.4) — Run screen: the hand + play area.
//
// 12.4 lands the coin components + interaction states: face-down hand
// (tap → pick, spring-snappy), 5 play slots (tap → unpick, spring-soft),
// 6th-pick shake + error. The rest of C6 — blind header, discard
// affordance, Confirm/Score, toss 3D, Echo re-flip, charm bar, ticker —
// lands in 12.5/12.6.

import { useEffect, useState } from 'react'
import { isFilled } from '@/core/helpers'
import type { Hand } from '@/core/types'
import { useRunStore } from '@/state/runStore'
import { HandCoin } from '@/components/hand/hand-coin'
import { PlaySlot } from '@/components/hand/play-slot'

interface HandRowProps {
  hand: Hand
  canPick: boolean
  shake: { id: number; n: number } | null
  onPick: (i: number) => void
}

/** The face-down hand row: tappable coins + empty-slot placeholders. */
function HandRow({ hand, canPick, shake, onPick }: HandRowProps) {
  return (
    <div className="hand-row">
      {hand.map((slot, i) =>
        slot.kind === 'filled' ? (
          <HandCoin
            key={slot.coin.id}
            coin={slot.coin}
            index={i}
            enabled={canPick}
            shaking={shake?.id === slot.coin.id}
            shakeKey={shake?.n ?? 0}
            onPick={() => onPick(i)}
          />
        ) : (
          <div key={`empty-${i}`} className="hand-slot--empty" aria-hidden />
        ),
      )}
    </div>
  )
}

export function RunScreen() {
  const hand = useRunStore((s) => s.hand)
  const play = useRunStore((s) => s.play)
  const handPhase = useRunStore((s) => s.handPhase)
  const drawHand = useRunStore((s) => s.drawHand)
  const pickCoin = useRunStore((s) => s.pickCoin)
  const unpickCoin = useRunStore((s) => s.unpickCoin)

  // Draw (automatic, SDD C6 step 1): the store sits in 'draw' at hand
  // start; the UI drives the auto-draw.
  useEffect(() => {
    if (handPhase === 'draw') drawHand()
  }, [handPhase, drawHand])

  // 6th-pick feedback (UX §3): play full → shake the tapped coin 3px
  // (+ error sfx in M13). The store no-ops the pick; the UI shows why.
  const [shake, setShake] = useState<{ id: number; n: number } | null>(null)

  const handlePick = (i: number) => {
    const slot = hand[i]
    if (slot.kind !== 'filled') return
    if (play.every(isFilled)) {
      setShake((s) => ({ id: slot.coin.id, n: (s?.n ?? 0) + 1 }))
      return
    }
    pickCoin(i)
  }

  // The face is resolved once the toss phase has run (play → toss → buff
  // is synchronous in the store; the UI observes 'buff'/'score').
  const revealed = handPhase === 'toss' || handPhase === 'buff' || handPhase === 'score'
  const canPick = handPhase === 'play'

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <div className="play-row">
        {play.map((slot, i) => (
          <PlaySlot
            key={i}
            slot={slot}
            index={i}
            revealed={revealed}
            onUnpick={() => unpickCoin(i)}
          />
        ))}
      </div>

      <HandRow hand={hand} canPick={canPick} shake={shake} onPick={handlePick} />
    </main>
  )
}
