// Motion tokens (SDD UX §2) — shared spring / easing / duration constants for
// framer-motion (motion). Reference these; do not hardcode curves inline.
// Easings are framer bezier tuples (motion's `Easing`); CSS uses the matching
// `--ease-out` / `--ease-back` custom properties in index.css.

export const EASING = {
  out: [0.25, 1, 0.5, 1] as const,
  back: [0.34, 1.56, 0.64, 1] as const, // overshoot
} as const

export const SPRING = {
  snappy: { stiffness: 520, damping: 30 }, // pick / snap, buttons
  soft: { stiffness: 210, damping: 26 }, // panels, layout shifts
  bouncy: { stiffness: 420, damping: 18 }, // coin land, banners
} as const

// durations in milliseconds
export const DURATION = { micro: 90, quick: 160, base: 240, slow: 400 } as const

// Named animations (SDD UX §5 table) — per-animation durations/staggers.
// `deal`: coins fly from the deck to the hand, 220ms, 40ms stagger, ease-out.
// `discard`: coin flies to the discard well + fade, 180ms, ease-out.
export const DEAL = { duration: 0.22, stagger: 0.04 } as const
export const DISCARD = { duration: 0.18 } as const
