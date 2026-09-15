// C5–C9 — App shell: renders the screen for the current RunState.phase and
// plays the screen-in/out transition on phase change (SDD UX §5: slide + fade,
// ~300ms, spring-soft). Under prefers-reduced-motion it degrades to a plain
// cross-fade (UX §8) — same final screen, no slide.

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { SPRING } from '@/lib/motion'
import { useRunStore } from '@/state/runStore'
import { MenuScreen } from '@/pages/menu'
import { RunScreen } from '@/pages/run'
import { ShopScreen } from '@/pages/shop'
import { RunEndScreen } from '@/pages/run-end'
import { BlindClearConfetti, ParticleLayer } from '@/components/juice/particles.tsx'

const SCREENS = {
  menu: MenuScreen,
  run: RunScreen,
  shop: ShopScreen,
  runEnd: RunEndScreen,
} as const

function Screens() {
  const phase = useRunStore((s) => s.phase)
  const reduceMotion = useReducedMotion()
  const Screen = SCREENS[phase]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
        transition={SPRING.soft}
      >
        <Screen />
      </motion.div>
    </AnimatePresence>
  )
}

/** The app-root juice layer (13.5): the particle canvas (persistent across
 *  screens so the blind-clear confetti outlives the run screen) + the
 *  blind-clear confetti trigger. */
function JuiceLayer() {
  return (
    <>
      <ParticleLayer />
      <BlindClearConfetti />
    </>
  )
}

export default function App() {
  return (
    <>
      <Screens />
      <JuiceLayer />
    </>
  )
}
