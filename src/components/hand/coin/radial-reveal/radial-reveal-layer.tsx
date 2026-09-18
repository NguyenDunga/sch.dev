// The RadialReveal reveal layer (M19): the hovered item's icon, radially
// wiped in. Plays in two beats (the "wind-up"): a TINY slow peek grows for
// ~1s (the anticipation — the circle creeps out from the wedge direction and
// the glyph expands a little), then the wipe lands FAST (~250ms) to full
// radius while the glyph scales up to full size (the expand). The wipe uses
// framer-motion's clipPath keyframes (0% → peek → 90%) with a directional
// origin; the glyph's scale keyframes ride the same timeline. Collapses fast
// on exit (no anticipation). Reduced motion → duration 0 (instant).

import { motion, type Transition } from 'framer-motion'
import type { ComponentType } from 'react'
import type { IconProps } from '@/components/ui/icon'
import { GlyphStack } from './radial-reveal-glyph'
import { ANTICIPATE, PEEK_RADIUS, SCALE_PEEK, SCALE_REST, WIPE } from './radial-constant'



export function RevealLayer({
  icon: RevealIcon,
  color,
  text,
  iconSize,
  diskSize,
  origin,
  reduced,
}: {
  icon: ComponentType<IconProps>
  color?: string
  text?: string
  iconSize: number
  diskSize: number
  /** The directional origin (the wedge direction, as a CSS position). */
  origin: string
  reduced: boolean
}) {
  // The reveal timeline (anticipation + wipe) as keyframe times:
  // [start, anticipation end, full wipe].
  const total = ANTICIPATE + WIPE
  const times = [0, ANTICIPATE / total, 1]
  const revealTransition: Transition = reduced
    ? { duration: 0 }
    : { duration: total, times, ease: ['easeInOut', 'easeOut'] }
  // The collapse (disk hover / wedge switch): fast, no anticipation.
  const collapseTransition: Transition = { duration: reduced ? 0 : 0.2, ease: 'easeIn' }

  return (
    <motion.div
      className="radial-reveal-reveal"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        backgroundColor: 'var(--line)',
      }}
      initial={{ clipPath: `circle(0% at ${origin})` }}
      animate={{
        clipPath: [`circle(0% at ${origin})`, `circle(${PEEK_RADIUS}% at ${origin})`, `circle(90% at ${origin})`],
      }}
      exit={{ clipPath: `circle(0% at ${origin})`, transition: collapseTransition }}
      transition={revealTransition}
    >
      <motion.div
        className="radial-reveal-glyph"
        style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          transformOrigin: origin,
        }}
        initial={{ scale: SCALE_REST }}
        animate={{ scale: [SCALE_REST, SCALE_PEEK, 1] }}
        exit={{ scale: SCALE_REST, transition: collapseTransition }}
        transition={revealTransition}
      >
        <GlyphStack icon={RevealIcon} color={color} text={text} iconSize={iconSize} diskSize={diskSize} />
      </motion.div>
    </motion.div>
  )
}
