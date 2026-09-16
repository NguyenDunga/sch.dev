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
// `toss` (13.2): 3D flip + settle (UX §4/§5), 700–900ms total. The rise is
// ease-out; the landing is a spring-bouncy settle whose overshoot IS the
// bounce. `tumble` ends exactly at the first landing (rise + ~110ms, the
// bouncy spring's first zero-crossing).
export const TOSS = {
  rise: 0.4,
  tumble: 0.51,
  stagger: 0.05, // left→right
} as const
// `echo` (13.2): single-coin re-toss (UX §5), ~500ms, spring-bouncy.
export const ECHO = {
  rise: 0.15,
  tumble: 0.26,
} as const

// Choreography beat durations (SDD UX §6) — the per-beat pop durations (s).
export const CHOREO = {
  chip: { duration: 0.3, stagger: 0.07 }, // chip pop
  total: { duration: 0.22 }, // total pop (EASING.back)
  tier: { duration: 0.12 }, // tier pop
  cashFly: { duration: 0.35, stagger: 0.04 }, // cash fly
  cashPop: { duration: 0.25, stagger: 0.08 }, // cash pop
  skip: { duration: 0.25 }, // skip button
  shake: { duration: 0.3 }, // hand-coin shake
} as const

// Screen-shake durations (ms) — the shakeScreen duration arg.
export const SHAKE_DURATION = 300 as const // default
export const CLEAR_SHAKE_DURATION = 350 as const // blind-clear (UX §7: 10px)
