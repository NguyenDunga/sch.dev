// The RadialReveal ring (M19): the SVG pie-slice hit areas (one per item,
// per-wedge color). The conic-gradient background lives in
// radial-reveal-geometry (ringBackground).

import type { RadialRevealItem } from '../radial-reveal'
import { wedgePath } from '../radial-reveal-geometry'

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
        return (
          <path
            key={i}
            d={wedgePath(c, rOuter, rInner, start, end)}
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
