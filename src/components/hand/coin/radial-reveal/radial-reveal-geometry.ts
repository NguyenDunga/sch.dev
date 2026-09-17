// Geometry + background helpers for the RadialReveal (M19): polar → cartesian
// conversion (used by the ring hit areas and the directional wipe origin) and
// the conic-gradient ring background.

import type { RadialRevealItem } from './radial-reveal'

/** Convert polar (r, angleDeg) to cartesian (x, y) around a center.
 *  0deg = up (12 o'clock), increasing clockwise. */
export function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/** The conic-gradient ring background (one color stop pair per item). */
export function ringBackground(items: RadialRevealItem[], gap: number): string {
  if (items.length === 0) return 'transparent'
  const n = items.length
  return `conic-gradient(${items
    .map((item, i) => {
      const start = i * (360 / n) + gap
      const end = (i + 1) * (360 / n) - gap
      return `${item.color} ${start}deg ${end}deg`
    })
    .join(', ')})`
}
