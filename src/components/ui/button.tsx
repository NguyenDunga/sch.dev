import { cn } from "cn"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { LoaderCircle } from "lucide-react"

import { buttonVariants, flashCss, loadingCss } from "./button/buttonVariants"
import type { VariantProps } from "class-variance-authority"

function Button({
  className,
  variant = "primary",
  size = "default",
  pulse = false,
  loading = false,
  flash = false,
  children,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & {
    /** Ambient bob + coral glow for key CTAs. */
    pulse?: boolean
    /** Spinner + locked pressed-down look while the action is in flight. */
    loading?: boolean
    /** One-shot white sweep across the face. Set true to fire, clear it after the animation (e.g. onAnimationEnd). */
    flash?: boolean
  }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      aria-busy={loading || undefined}
      className={cn(
        buttonVariants({ variant, size, pulse, className }),
        loading && loadingCss,
        flash && flashCss,
      )}
      {...props}
    >
      {loading && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
