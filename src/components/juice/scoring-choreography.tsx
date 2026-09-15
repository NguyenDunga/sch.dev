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
// Screen shake (beat 5, tier-scaled) lands in 13.6; the per-beat sfx
// (tier_hit / chip / mult / cash) in 13.7; the settle burst / confetti in
// 13.5. Reduced motion (UX §8): fast beats (≤150ms), no flights/flares.

import { useEffect, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'
import { motion } from 'framer-motion'
import { SHAKE_AMPLITUDE } from './choreography'
import { shakeScreen } from './screen-shake'
import { none, some } from '@/core/helpers'
import type { CharmId, Score, TierId } from '@/core/types'
import { EASING } from '@/lib/motion'
import {
  bannerText,
  cashCoinCount,
  chipCount,
  isBigHit,
  matchedIndices,
  TIER_COLOR_VAR,
  type Beat,
  type ChoroSeq,
  type SnapshotCoin,
} from './choreography'
import { emitBurst } from './particles'

/** The coin row's center (viewport fractions) — the flights' origin. */
const ROW_X = 0.5
const ROW_Y = 0.44

/** The flight target: the counter's center (viewport coords); a fallback
 *  (lower-center) when the ref is absent (jsdom / not rendered yet). */
function useFlightTarget(ref: RefObject<HTMLElement | null>): { x: number; y: number } {
  const [target, setTarget] = useState(() => ({ x: window.innerWidth / 2, y: window.innerHeight * 0.8 }))
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) return
    setTarget({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
  }, [ref])
  return target
}

interface ChoreoCoinsProps {
  coins: SnapshotCoin[]
  matched: number[]
  tierColor: string | null
  beat: Beat
  reduced: boolean
}

/** Beat 1 — reveal & match: the tossed coins pop in (70ms stagger); the
 *  matched pattern pulses + glows in the tier color; the others dim. The
 *  row stays through the resolve (beat 5) and fades on the cash fly. */
function ChoreoCoins({ coins, matched, tierColor, beat, reduced }: ChoreoCoinsProps) {
  return (
    <div className={`choreo-coins${beat >= 6 ? ' choreo-coins--fade' : ''}`}>
      {coins.map((c, i) => {
        const isMatch = matched.includes(i)
        return (
          <motion.span
            key={c.coin.id}
            className={`choreo-coin choreo-coin--${c.face.toLowerCase()}${
              isMatch ? ' choreo-coin--match' : ' choreo-coin--dim'
            }`}
            style={isMatch && tierColor ? ({ '--tier': tierColor } as CSSProperties) : undefined}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
            animate={
              reduced
                ? { opacity: isMatch ? 1 : 0.45 }
                : isMatch
                  ? { opacity: 1, scale: [0.5, 1.15, 1] }
                  : { opacity: 0.45, scale: [0.5, 1] }
            }
            transition={reduced ? { duration: 0.16 } : { duration: 0.3, delay: i * 0.07, ease: EASING.back }}
          >
            {c.face}
          </motion.span>
        )
      })}
    </div>
  )
}

interface TierBannerProps {
  score: Score
  beat: Beat
  tierColor: string | null
  reduced: boolean
}

/** Beat 2 — the tier banner slams in (scale 0.6 → 1, ease-back 220ms) +
 *  a 120ms tier-color flash; it exits on the mult flare (beat 4). The
 *  wrapper carries the centering transform so framer's scale animation
 *  doesn't fight it (framer owns the motion element's transform). */
function TierBanner({ score, beat, tierColor, reduced }: TierBannerProps) {
  const scored = score.kind === 'scored'
  const exiting = beat >= 4
  return (
    <>
      <div className="choreo-banner-wrap">
        <motion.div
          className={`choreo-banner${scored ? '' : ' choreo-banner--none'}`}
          style={scored && tierColor ? { background: tierColor } : undefined}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
          animate={exiting ? { opacity: 0, scale: 0.9 } : { opacity: 1, scale: 1 }}
          transition={
            exiting
              ? { duration: 0.16, ease: EASING.out }
              : reduced
                ? { duration: 0.16 }
                : { duration: 0.22, ease: EASING.back }
          }
        >
          {bannerText(score)}
        </motion.div>
      </div>
      {beat === 2 && scored && tierColor && (
        <motion.div
          className="choreo-flash"
          style={{ background: tierColor }}
          initial={{ opacity: 0.18 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.12, ease: EASING.out }}
        />
      )}
    </>
  )
}

interface ChipFlightProps {
  score: Score
  matched: number[]
  charms: CharmId[]
  tierColor: string | null
  targetRef: RefObject<HTMLElement | null>
}

/** Beat 3 — chips build: one chip per contributing coin/charm flies from
 *  the coin row to the chips counter (the counter ticks up in the ticker;
 *  the rising-pitch chip sfx lands in 13.7). */
function ChipFlight({ score, matched, charms, tierColor, targetRef }: ChipFlightProps) {
  const target = useFlightTarget(targetRef)
  const n = chipCount(score, matched, charms)
  const cx = window.innerWidth * ROW_X
  const cy = window.innerHeight * ROW_Y
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const sx = cx + (i - (n - 1) / 2) * 36
        return (
          <motion.span
            key={i}
            className="choreo-chip"
            style={{ background: tierColor ?? 'var(--primary)' }}
            initial={{ x: sx, y: cy, opacity: 1, scale: 1 }}
            animate={{ x: target.x - sx, y: target.y - cy, opacity: 0.7, scale: 0.55 }}
            transition={{ duration: 0.35, delay: i * 0.04, ease: EASING.out }}
          />
        )
      })}
    </>
  )
}

interface CashFlightProps {
  coins: SnapshotCoin[]
  targetRef: RefObject<HTMLElement | null>
}

/** Beat 6 — cash: each Tax/Jackpot coin flips up a coin that flies to the
 *  cash counter (250ms each, ease-back, 80ms stagger — UX §5 cash-fly). */
function CashFlight({ coins, targetRef }: CashFlightProps) {
  const target = useFlightTarget(targetRef)
  const payers = coins.filter((c) => c.coin.effects.some((e) => e.kind === 'tax' || e.kind === 'jackpot'))
  const cx = window.innerWidth * ROW_X
  const cy = window.innerHeight * ROW_Y
  return (
    <>
      {payers.map((c, i) => (
        <motion.span
          key={c.coin.id}
          className="choreo-cash-coin"
          initial={{ x: cx, y: cy, opacity: 1, scale: 0.6, rotate: -90 }}
          animate={{ x: target.x - cx, y: target.y - cy, opacity: 0.9, scale: 1, rotate: 0 }}
          transition={{ duration: 0.25, delay: i * 0.08, ease: EASING.back }}
        >
          $
        </motion.span>
      ))}
    </>
  )
}

interface BeatBurstsProps {
  beat: Beat
  tierColor: string | null
  /** The scored tier (drives the resolve shake amplitude, UX §7). */
  tier: TierId | null
  chipsRef: RefObject<HTMLElement | null>
  cashRef: RefObject<HTMLElement | null>
}

/** 13.5 — the particle bursts on their beats (UX §7): a chip burst (6–12,
 *  tier color) at the chips counter on beat 3, a cash burst at the cash
 *  counter on beat 6. Purely presentational (UX §0). */
function BeatBursts({ beat, tierColor, tier, chipsRef, cashRef }: BeatBurstsProps) {
  const chipsTarget = useFlightTarget(chipsRef)
  const cashTarget = useFlightTarget(cashRef)
  useEffect(() => {
    if (beat === 3) emitBurst({ x: chipsTarget.x, y: chipsTarget.y, color: tierColor ?? 'var(--primary)', count: 10 })
    if (beat === 6) emitBurst({ x: cashTarget.x, y: cashTarget.y, color: 'var(--heads)', count: 12 })
    // 13.6 — the resolve shake: amplitude scaled by tier (UX §7), zero
    // under reduced motion (the trigger is a no-op there, UX §8).
    if (beat === 5 && tier) shakeScreen({ amplitude: SHAKE_AMPLITUDE[tier], duration: 300 })
  }, [beat, chipsTarget, cashTarget, tierColor, tier])
  return null
}

/** Beat 5 — the --primary flash on big hits (UX §6). */
function PrimaryFlash() {
  return (
    <motion.div
      className="choreo-flash choreo-flash--primary"
      initial={{ opacity: 0.14 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: EASING.out }}
    />
  )
}

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
  const tier = score.kind === 'scored' ? score.tier : null
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
      <BeatBursts beat={beat} tierColor={tierColor} tier={tier} chipsRef={chipsRef} cashRef={cashRef} />
    </div>
  )
}
