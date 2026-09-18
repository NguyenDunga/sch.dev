import { cn } from "cn"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { withIcon } from "./icon"
import { FaSpinner } from "react-icons/fa6"

import { buttonVariants, flashCss, loadingCss } from "./button/buttonVariants"
import type { VariantProps } from "class-variance-authority"
import { playSfx } from "@/components/juice/sfx"
import type { SfxEvent } from "@/components/juice/sfx"

const SpinnerIcon = withIcon(FaSpinner)

function Button({
  className,
  variant = "primary",
  size = "default",
  pulse = false,
  loading = false,
  flash = false,
  sfx = "button",
  onClick,
  children,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & {
    /** Ambient bob + coral glow for key CTAs. */
    pulse?: boolean
    /** Spinner + locked pressed-down look while the action is in flight. */
    loading?: boolean
    /** One-shot white sweep across the face. Set true to fire, clear it after the animation (e.g. onAnimationEnd). */
    flash?: boolean
    /** The sound-map event on click (UX §10: button / reroll / buy). */
    sfx?: SfxEvent
  }) {
  const handleClick: NonNullable<ButtonPrimitive.Props['onClick']> = (e) => {
    if (!loading) playSfx(sfx)
    onClick?.(e)
  }
  return (
    <ButtonPrimitive
      data-slot="button"
      aria-busy={loading || undefined}
      className={cn(
        buttonVariants({ variant, size, pulse, className }),
        loading && loadingCss,
        flash && flashCss,
      )}
      onClick={handleClick}
      {...props}
    >
      {loading && <SpinnerIcon aria-hidden className="size-4 animate-spin" />}
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
