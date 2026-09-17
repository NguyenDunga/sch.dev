// Toss coin (12.5 + 13.2) — the 3D coin that flies up, tumbles, and settles
// on the resolved face (SDD UX §4). Built with CSS 3D transforms (NOT
// r3f/rapier — see the M12.5 deviation note): CSS is inherently flat + unlit,
// so it upholds "never reads as realistic" with zero WebGL, no WASM, and a
// jsdom-testable path.
//
// The outcome is never animation-derived — the face is already resolved in
// the store (confirmPlay / echoReflip); the animation always lands on
// `Slot.face` (UX §0).
//
// Two modes (UX §5 table), both tuned to spring-bouncy (13.2):
//   - toss (initial): arc up + 2-spin tumble, 700–900ms, staggered
//     left→right (index * TOSS.stagger). → `toss-flip`
//   - echo (re-flip, 12.6): one spin + small arc, ~500ms, no stagger.
//
// Reduced motion (UX §4/§8): a 2D cross-fade of the face (~160ms), no arc,
// no tumble, no 3D — same landing face. → `toss-crossfade`
//
// This file only picks the mode; the modes are their own modules.

import { useReducedMotion } from 'framer-motion'
import type { CoinEffect, Face } from '@/core/types'
import { FlipCoin } from './toss-flip'
import { CrossfadeCoin } from './toss-crossfade'

export interface TossCoinProps {
  face: Face
  /** Hand index — used for the initial-toss stagger only. */
  index: number
  effects: CoinEffect[]
  /** Quick single-axis re-flip (Echo) — shorter, no stagger. */
  quick?: boolean
  /** 13b.8 — fired when the coin first lands (the rise completes), with the
   *  coin's slot index (a stable callback — the index is a prop, not a
   *  closure, so it never re-triggers the toss animation). */
  onLand?: (index: number) => void
}

export function TossCoin({ face, index, effects, quick = false, onLand }: TossCoinProps) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return <CrossfadeCoin face={face} effects={effects} index={index} onLand={onLand} />
  return <FlipCoin face={face} index={index} effects={effects} quick={quick} onLand={onLand} />
}
