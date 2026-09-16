// Face-down coin (13c.3) — the back of a coin (a "?" mystery face).
// Ceramic Tactile (UX §2): flat, 2px stroke, no gradients.

interface IconProps {
  size?: number
  strokeWidth?: number
  className?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}

export function FaceDownIcon({ size = 24, strokeWidth = 2, className, ...rest }: IconProps) {
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
      {/* question mark */}
      <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 1.8-2.5 3.5" />
      <line x1="12" y1="16.5" x2="12" y2="16.51" />
    </svg>
  )
}
