import { useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { TIERS } from '@/core/balance'
import type { Score } from '@/core/types'

function CountUp({ value, duration = 0.5 }: { value: number; duration?: number }) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString())
  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: 'easeOut' })
    return () => controls.stop()
  }, [mv, value, duration])
  return <motion.span>{text}</motion.span>
}

/** chips × mult = total for the last hand, counting up on each score. */
export function ScoreTicker({ score }: { score: Score | null }) {
  if (!score) {
    return (
      <div className="score-ticker" aria-live="polite">
        <span className="score-ticker-tier">—</span>
        <span className="score-ticker-math score-ticker--idle">— × — = —</span>
      </div>
    )
  }

  const tier = score.tier ? TIERS.find((t) => t.id === score.tier)! : null
  return (
    <div className="score-ticker" aria-live="polite">
      <span className="score-ticker-tier">{tier ? tier.name : 'No coins'}</span>
      <span className={`score-ticker-math${score.total === 0 ? ' score-ticker--idle' : ''}`}>
        <CountUp value={score.chips} /> × <CountUp value={score.mult} /> ={' '}
        <span className="score-ticker-total">
          <CountUp value={score.total} />
        </span>
      </span>
      {score.cash > 0 && (
        <span className="score-ticker-cash">+${score.cash} cash</span>
      )}
    </div>
  )
}
