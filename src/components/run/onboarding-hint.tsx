// 13a.10 — first-run onboarding hint. The 13a.5–13a.7 input model (drag to
// play, drag to the bin, match a pattern) is opaque to a first-time player:
// a small sticker banner explains the three core gestures. Shown only on
// the first run (the localStorage flag is set when it appears and on
// dismiss — lib/onboarding), never blocks input (pointer-events: none except
// on the × button), and the entrance is a plain fade (no motion under
// prefers-reduced-motion, UX §8). Purely presentational — it reads/writes a
// UI flag only; the store is untouched (UX §0).

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { EASING, DURATION } from '@/lib/motion'
import { hasSeenOnboarding, markOnboardingSeen } from '@/lib/onboarding'

/** The three core gestures of the 13a input model. */
const HINT_TEXT = 'Drag a coin to the play row to pick it · drag it into the bin to discard · match a pattern to score'

/** The entrance/exit slide (0.4rem, the old `onboarding-in` keyframe). */
const SLIDE_Y = -6.4

/** A dismissible sticker banner, shown only on the first run. The entrance
 *  (fade + slide down) and the dismiss exit (fade + slide up) are Motion
 *  (13b.7) via AnimatePresence — no @keyframes. The centering translateX is
 *  a Motion `x` value (not a CSS transform, so it composes with the slide).
 *  Reduced motion (UX §8): no entrance/exit slide (instant show/dismiss). */
export function OnboardingHint() {
  const [visible, setVisible] = useState(() => !hasSeenOnboarding())
  const reduceMotion = useReducedMotion() ?? false
  // First show = seen: persist immediately (the hint never comes back).
  useEffect(() => {
    if (visible) markOnboardingSeen()
  }, [visible])
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="onboarding-hint"
          role="note"
          aria-label="Getting started"
          style={{ x: '-50%' }}
          initial={reduceMotion ? false : { opacity: 0, y: SLIDE_Y }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? false : { opacity: 0, y: SLIDE_Y }}
          transition={{ duration: DURATION.slow / 1000, ease: EASING.out }}
        >
          <p>{HINT_TEXT}</p>
          <button
            type="button"
            className="onboarding-hint-close"
            onClick={() => {
              markOnboardingSeen()
              setVisible(false)
            }}
            aria-label="Dismiss hint"
          >
            <X size={16} strokeWidth={2.5} aria-hidden />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
