import { useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { TIERS } from '@/core/balance'
import { isSome } from '@/core/types'
import type { Option, Score } from '@/core/types'

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
export function ScoreTicker({ score }: { score: Option<Score> }) {
  if (!isSome(score)) {
    return (
      <div className="score-ticker" aria-live="polite">
        <span className="score-ticker-tier">—</span>
        <span className="score-ticker-math score-ticker--idle">— × — = —</span>
      </div>
    )
  }

  const result = score.value
  const scored = result.kind === 'scored'
  const tierName = scored ? TIERS.find((t) => t.id === result.tier)!.name : 'No coins'
  const chips = scored ? result.chips : 0
  const mult = scored ? result.mult : 0
  const total = scored ? result.total : 0
  return (
    <div className="score-ticker" aria-live="polite">
      <span className="score-ticker-tier">{tierName}</span>
      <span className={`score-ticker-math${total === 0 ? ' score-ticker--idle' : ''}`}>
        <CountUp value={chips} /> × <CountUp value={mult} /> ={' '}
        <span className="score-ticker-total">
          <CountUp value={total} />
        </span>
      </span>
      {result.cash > 0 && (
        <span className="score-ticker-cash">+${result.cash} cash</span>
      )}
    </div>
  )
}
