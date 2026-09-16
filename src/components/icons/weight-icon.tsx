// Weight coin effect (13c.4) — a balance scale (75/25 bias toward a face).
// Ceramic Tactile (UX §2): flat, 2px stroke, no gradients.

interface IconProps {
  size?: number
  strokeWidth?: number
  className?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}

export function WeightIcon({ size = 24, strokeWidth = 2, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {/* central post */}
      <line x1="12" y1="4" x2="12" y2="20" />
      {/* base */}
      <line x1="8" y1="20" x2="16" y2="20" />
      {/* beam */}
      <line x1="5" y1="7" x2="19" y2="7" />
      {/* left pan (bigger — the favoured side) */}
      <path d="M5 7 L2.5 12 A 2.5 2.5 0 0 0 7.5 12 Z" />
      {/* right pan (smaller) */}
      <path d="M19 7 L17 11 A 2 2 0 0 0 21 11 Z" />
    </svg>
  )
}
