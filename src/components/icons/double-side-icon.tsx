// Double-Side coin effect (13c.4) — two overlapping coins (both faces).
// Ceramic Tactile (UX §2): flat, 2px stroke, no gradients.

interface IconProps {
  size?: number
  strokeWidth?: number
  className?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}

export function DoubleSideIcon({ size = 24, strokeWidth = 2, className, ...rest }: IconProps) {
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
      {/* back coin (offset up-right) */}
      <circle cx="15" cy="9" r="6" />
      {/* front coin (offset down-left) */}
      <circle cx="9" cy="15" r="6" />
    </svg>
  )
}
