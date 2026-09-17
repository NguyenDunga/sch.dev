// The RadialReveal ring (M19): the SVG pie-slice hit areas (one per item,
// per-wedge color). The conic-gradient background lives in
// radial-reveal-geometry (ringBackground).

import type { RadialRevealItem } from './radial-reveal'
import { polarToCartesian } from './radial-reveal-geometry'

/** The SVG ring hit areas (one pie-slice per item). */
export function RingHits({
  items,
  size,
  ringWidth,
  gap,
  onEnter,
}: {
  items: RadialRevealItem[]
  size: number
  ringWidth: number
  gap: number
  onEnter: (i: number) => void
}) {
  const n = items.length
  const c = size / 2
  const rOuter = c
  const rInner = Math.max(0, c - ringWidth)
  return (
    <svg
      className="radial-reveal-hits"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {items.map((item, i) => {
        const start = i * (360 / n) + gap
        const end = (i + 1) * (360 / n) - gap
        const p1 = polarToCartesian(c, c, rOuter, start)
        const p2 = polarToCartesian(c, c, rOuter, end)
        const p3 = polarToCartesian(c, c, rInner, end)
        const p4 = polarToCartesian(c, c, rInner, start)
        const large = end - start > 180 ? 1 : 0
        const d = `M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 ${large} 0 ${p4.x} ${p4.y} Z`
        return (
          <path
            key={i}
            d={d}
            fill="transparent"
            style={{ pointerEvents: 'all', cursor: 'pointer' }}
            onMouseEnter={() => onEnter(i)}
            aria-label={item.label}
          />
        )
      })}
    </svg>
  )
}
