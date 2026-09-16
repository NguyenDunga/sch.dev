// Coin Motion — the animation wrapper (layer 5 of 5).
//
// Handles: deal flight, hover tilt (3D), shake (6th-pick error).
// All Motion-driven (framer-motion) — no direct style writes, no key remount.
//
// Reduced motion (UX §8): quick fade, no flight/stagger/tilt/shake.

import { useEffect, type ReactNode } from 'react'
import { motion, useAnimate, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { CHOREO, DEAL, DURATION, EASING, SPRING } from '@/lib/motion'

interface CoinMotionProps {
  children: ReactNode
  /** Stagger index among freshly dealt coins (undefined = not a fresh deal). */
  dealIndex?: number
  /** Whether the coin is enabled (tilt only when enabled). */
  enabled: boolean
  /** Whether a drag is in flight (tilt off mid-drag). */
  dragging: boolean
  /** Whether the 6th-pick shake is playing. */
  shaking: boolean
  /** Bumped on every shake so the animation can restart. */
  shakeKey: number
}

/** Max tilt in degrees (UX §3: max 8°). */
const MAX_TILT_DEG = 8

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

export function CoinMotion({
  children,
  dealIndex,
  enabled,
  dragging,
  shaking,
  shakeKey,
}: CoinMotionProps) {
  const reduceMotion = useReducedMotion() ?? false
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const shakeX = useMotionValue(0)
  const springRotateX = useSpring(rotateX, SPRING.snappy)
  const springRotateY = useSpring(rotateY, SPRING.snappy)
  const [, animate] = useAnimate()

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabled || reduceMotion || dragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    rotateX.set(-y * MAX_TILT_DEG * 2)
    rotateY.set(x * MAX_TILT_DEG * 2)
  }

  const onPointerLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

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
      <motion.div
        className="coin-motion-tilt"
        style={{ rotateX: springRotateX, rotateY: springRotateY, x: shakeX }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
