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

/** The SVG path for a ring wedge (annular sector) from start to end (deg,
 *  0 = up, clockwise), between rInner and rOuter around center c.
 *
 *  A full 360° span (a single wedge — e.g. a 2-effect coin, whose one
 *  non-top effect takes the whole ring) is special-cased: an SVG arc from a
 *  point to itself is degenerate (zero area), so the donut is built from two
 *  180° arcs per circle (outer clockwise, inner counter-clockwise — the
 *  nonzero fill rule keeps only the ring between them). */
export function wedgePath(c: number, rOuter: number, rInner: number, start: number, end: number): string {
  const span = end - start
  if (span >= 360) {
    const o1 = polarToCartesian(c, c, rOuter, start)
    const o2 = polarToCartesian(c, c, rOuter, start + 180)
    const i1 = polarToCartesian(c, c, rInner, start)
    const i2 = polarToCartesian(c, c, rInner, start + 180)
    return [
      `M ${o1.x} ${o1.y}`,
      `A ${rOuter} ${rOuter} 0 1 1 ${o2.x} ${o2.y}`,
      `A ${rOuter} ${rOuter} 0 1 1 ${o1.x} ${o1.y}`,
      `L ${i1.x} ${i1.y}`,
      `A ${rInner} ${rInner} 0 1 0 ${i2.x} ${i2.y}`,
      `A ${rInner} ${rInner} 0 1 0 ${i1.x} ${i1.y}`,
      'Z',
    ].join(' ')
  }
  const p1 = polarToCartesian(c, c, rOuter, start)
  const p2 = polarToCartesian(c, c, rOuter, end)
  const p3 = polarToCartesian(c, c, rInner, end)
  const p4 = polarToCartesian(c, c, rInner, start)
  const large = span > 180 ? 1 : 0
  return `M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 ${large} 0 ${p4.x} ${p4.y} Z`
}
