// 13.3 — beats 1–2 of the scoring choreography (SDD UX §6): the coin row
// reveal/match and the tier banner slam. Purely presentational (UX §0).

import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import type { Score } from '@/core/types'
import { CHOREO, DURATION, EASING } from '@/lib/motion'
import { TIER_ICONS } from './tier-icons'
import { bannerText, type Beat, type SnapshotCoin } from '../choreography'

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
export function ChoreoCoins({ coins, matched, tierColor, beat, reduced }: ChoreoCoinsProps) {
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
            transition={reduced ? { duration: DURATION.quick / 1000 } : { duration: CHOREO.chip.duration, delay: i * CHOREO.chip.stagger, ease: EASING.back }}
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
export function TierBanner({ score, beat, tierColor, reduced }: TierBannerProps) {
  const scored = score.kind === 'scored'
  const exiting = beat >= 4
  const TierIcon = scored ? TIER_ICONS[score.tier].icon : null
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
              ? { duration: DURATION.quick / 1000, ease: EASING.out }
              : reduced
                ? { duration: DURATION.quick / 1000 }
                : { duration: CHOREO.total.duration, ease: EASING.back }
          }
        >
          {TierIcon && <TierIcon size={20} strokeWidth={2.5} aria-hidden className="choreo-banner-icon" />}
          {bannerText(score)}
        </motion.div>
      </div>
      {beat === 2 && scored && tierColor && (
        <motion.div
          className="choreo-flash"
          style={{ background: tierColor }}
          initial={{ opacity: 0.18 }}
          animate={{ opacity: 0 }}
          transition={{ duration: CHOREO.tier.duration, ease: EASING.out }}
        />
      )}
    </>
  )
}
