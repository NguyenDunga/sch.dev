// shadcn/ui dialog (M23.7b, unified M23.8) — @radix-ui/react-dialog, styled
// with the Ceramic Tactile semantic tokens (bg-card, ring-border, …).
// One component for both breakpoints: a full-height bottom sheet on
// phones, a centered fixed-size panel on md+ (the responsive shell lives in
// DialogContent below, so consumers never need a second dialog component).

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "cn"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  overlayClassName,
  onOverlayClick,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  /** Extra classes for the backdrop (e.g. a screen-specific z-index). */
  overlayClassName?: string
  /** Close on a plain click of the backdrop (jsdom-safe; Radix's
   *  onInteractOutside needs pointer events). */
  onOverlayClick?: () => void
}) {
  return (
    <DialogPortal>
      <DialogOverlay className={overlayClassName} onClick={onOverlayClick} />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // Phone: bottom sheet — full width (inset-x-0), full height, slides
          // up from the bottom edge. z-[80] sits above the overlay (z-50) and
          // the wiki's raised overlay (z-70); it ties coin-info (z-80) but the
          // portal is later in the DOM, so the dialog wins.
          "fixed inset-x-0 bottom-0 z-[80] flex h-full flex-col gap-4 rounded-t-(--r-lg) border-2 border-ink bg-card p-(--sp-6) shadow-(--shadow-hard-lg) outline-none",
          "ease-(--ease-out) data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=open]:duration-(--dur-base) data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=closed]:duration-(--dur-quick)",
          // md+: centered panel — shrink-to-fit (no w-full), capped at the
          // viewport minus 2rem, fade + zoom (the slide vars are zeroed so
          // the phone slide doesn't leak through).
          "md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-w-[calc(100%-2rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-b-(--r-lg)",
          "md:data-[state=open]:fade-in-0 md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=open]:zoom-in-95 md:data-[state=open]:duration-(--dur-quick) md:data-[state=closed]:fade-out-0 md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=closed]:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute right-4 top-4 cursor-pointer text-ink-soft transition-colors hover:text-ink focus-visible:outline-3 focus-visible:outline-primary"
          >
            ×
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("flex flex-col gap-1.5 text-center sm:text-left", className)} {...props} />
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-(--font-heading) text-(--text-lg) font-bold leading-none", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger }
