// Placeholder — screen shake wrapper.
// SDD UX §7 · WBS M13.6.
// Amplitude scaled by tier with exponential decay; ZERO under prefers-reduced-motion.
import type { ReactNode } from 'react'

export function ScreenShake({ children }: { children: ReactNode }) {
  // TODO: translate the wrapper on a shake trigger with exp decay; disabled on reduced-motion.
  return <>{children}</>
}
