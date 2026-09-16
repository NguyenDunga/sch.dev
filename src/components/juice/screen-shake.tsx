import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { motion, useAnimate, useMotionValue } from 'framer-motion'
import { setShakeTrigger } from './screen-shake'

/** The shaken wrapper (the app root — the resolve shake and the target-clear
 *  shake both move the whole screen).
 *
 * 13b.5: a `motion.div` driven by `x`/`y` motion values. The trigger
 * (registered with the screen-shake module) precomputes the exponential-decay
 * keyframes and lets Motion run them — no rAF loop in this component. */
export function ScreenShake({ children }: { children: ReactNode }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [, animate] = useAnimate()

  useEffect(() => {
    setShakeTrigger(({ amplitude, duration }) => {
      // Precompute the exponential-decay keyframes: amp · e^(−4t/T) in a
      // random direction (the original's per-frame formula, sampled at ~60Hz),
      // then let Motion run them as a single linear keyframe animation.
      const steps = Math.max(2, Math.round(duration / 16))
      const xk: number[] = []
      const yk: number[] = []
      for (let i = 0; i <= steps; i++) {
        const e = i / steps
        const a = amplitude * Math.exp(-4 * e)
        xk.push((Math.random() * 2 - 1) * a)
        yk.push((Math.random() * 2 - 1) * a)
      }
      xk.push(0) // settle exactly
      yk.push(0)
      animate(x, xk, { duration: duration / 1000, ease: 'linear' })
      animate(y, yk, { duration: duration / 1000, ease: 'linear' })
    })
    return () => setShakeTrigger(null)
  }, [animate, x, y])

  return (
    <motion.div className="screen-shake" style={{ x, y }}>
      {children}
    </motion.div>
  )
}
