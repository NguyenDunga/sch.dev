// Motion tokens (SDD UX §2) — shared spring / easing / duration constants for
// framer-motion (motion) and CSS. Reference these; do not hardcode curves inline.

export const EASING = {
  out: 'cubic-bezier(0.25, 1, 0.5, 1)',
  back: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // overshoot
} as const

export const SPRING = {
  snappy: { stiffness: 520, damping: 30 }, // pick / snap, buttons
  soft: { stiffness: 210, damping: 26 }, // panels, layout shifts
  bouncy: { stiffness: 420, damping: 18 }, // coin land, banners
} as const

// durations in milliseconds
export const DURATION = { micro: 90, quick: 160, base: 240, slow: 400 } as const
