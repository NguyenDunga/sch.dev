// Coin Motion — the animation wrapper (layer 5 of 5).
//
// Handles: deal flight, shake (6th-pick error).
// All Motion-driven (framer-motion) — no direct style writes, no key remount.
//
// Hover feedback is a CSS pick-up lift (coin.css: `.coin:hover` →
// `translate 0 -4px`) — no 3D pointer tilt.
//
// Reduced motion (UX §8): quick fade, no flight/stagger/shake.

import { useEffect, type ReactNode } from 'react'
import { motion, useAnimate, useMotionValue, useReducedMotion } from 'framer-motion'
import { CHOREO, DEAL, DURATION, EASING } from '@/lib/motion'

interface CoinMotionProps {
  children: ReactNode
  /** Stagger index among freshly dealt coins (undefined = not a fresh deal). */
  dealIndex?: number
  /** Whether the 6th-pick shake is playing. */
  shaking: boolean
  /** Bumped on every shake so the animation can restart. */
  shakeKey: number
}

/** Deal flight origin: toward the deck (top-right of the hand row). */
const DEAL_FROM = { x: 140, y: -110, scale: 0.85 }

function dealProps(dealIndex: number | undefined, reduceMotion: boolean) {
  if (dealIndex === undefined) return { initial: false, transition: undefined }
  if (reduceMotion) {
    return { initial: { opacity: 0 }, transition: { duration: DURATION.quick / 1000, ease: EASING.out } }
  }
  return {
    initial: { x: DEAL_FROM.x, y: DEAL_FROM.y, opacity: 0, scale: DEAL_FROM.scale },
    transition: { duration: DEAL.duration, delay: dealIndex * DEAL.stagger, ease: EASING.out },
  }
}

export function CoinMotion({ children, dealIndex, shaking, shakeKey }: CoinMotionProps) {
  const reduceMotion = useReducedMotion() ?? false
  const [, animate] = useAnimate()
  const shakeX = useMotionValue(0)

  // The 6th-pick shake (3px): a Motion keyframe run on shakeKey change.
  useEffect(() => {
    if (!shaking || reduceMotion) return
    const a = animate(shakeX, [0, -3, 3, -3, 3, 0], { duration: CHOREO.shake.duration, ease: 'easeOut' })
    return () => a.stop()
  }, [shaking, shakeKey, reduceMotion, animate, shakeX])

  const { initial, transition } = dealProps(dealIndex, reduceMotion)

  return (
    <motion.div
      className="coin-motion-deal"
      initial={initial}
      animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      transition={transition}
    >
      <motion.div className="coin-motion-shake" style={{ x: shakeX }}>
        {children}
      </motion.div>
    </motion.div>
  )
}
