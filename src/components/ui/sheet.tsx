// shadcn/ui sheet (M23.7b) — @radix-ui/react-dialog side variant, Ceramic
// Tactile tokens. On phone the wiki opens as a full-height bottom sheet.

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cn } from "cn"

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

type SheetSide = "top" | "bottom" | "left" | "right"

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn("fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-in data-[state=open]:fade-in-0", className)}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  overlayClassName,
  onOverlayClick,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: SheetSide
  showCloseButton?: boolean
  /** Extra classes for the backdrop (e.g. a screen-specific z-index). */
  overlayClassName?: string
  /** Close on a plain click of the backdrop (jsdom-safe). */
  onOverlayClick?: () => void
}) {
  return (
    <SheetPortal>
      <SheetOverlay className={overlayClassName} onClick={onOverlayClick} />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-card shadow-(--shadow-hard-lg) transition ease-(--ease-out) data-[state=closed]:animate-out data-[state=closed]:duration-(--dur-quick) data-[state=open]:animate-in data-[state=open]:duration-(--dur-base)",
          // full-height edge sheets (the wiki on phone is side="bottom" h-full)
          side === "bottom" && "inset-x-0 bottom-0 h-full data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          side === "top" && "inset-x-0 top-0 data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
          side === "left" && "inset-y-0 left-0 h-full w-3/4 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
          side === "right" && "inset-y-0 right-0 h-full w-3/4 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            className="absolute right-4 top-4 cursor-pointer text-ink-soft transition-colors hover:text-ink focus-visible:outline-3 focus-visible:outline-primary"
          >
            ×
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("flex flex-col gap-1.5", className)} {...props} />
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-footer" className={cn("mt-auto flex flex-col gap-2", className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-(--font-heading) text-(--text-lg) font-bold", className)}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description data-slot="sheet-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger }
