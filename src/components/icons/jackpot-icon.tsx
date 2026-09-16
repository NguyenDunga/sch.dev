// Jackpot coin effect (13c.4) — a star in a circle (the jackpot coin).
// Ceramic Tactile (UX §2): flat, 2px stroke, no gradients.

interface IconProps {
  size?: number
  strokeWidth?: number
  className?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}

export function JackpotIcon({ size = 24, strokeWidth = 2, className, ...rest }: IconProps) {
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
      {/* star */}
      <path d="M12 7 L13.5 10.5 L17 11 L14.5 13.5 L15 17 L12 15.5 L9 17 L9.5 13.5 L7 11 L10.5 10.5 Z" />
    </svg>
  )
}
