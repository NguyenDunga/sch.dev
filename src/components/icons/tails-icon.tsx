// Tails coin face (13c.3) — a themed coin glyph: a circle (coin) with a
// horizontal bar. Distinguishable from Heads by shape (colorblind-safe); the
// tails color (blue) is the secondary signal. Ceramic Tactile (UX §2):
// flat, 2px stroke, no gradients.

interface IconProps {
  size?: number
  strokeWidth?: number
  className?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}

export function TailsIcon({ size = 24, strokeWidth = 2, className, ...rest }: IconProps) {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="6" y1="12" x2="18" y2="12" />
    </svg>
  )
}
