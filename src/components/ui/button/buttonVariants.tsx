import { buttonPhysics } from "./buttonPhysics";
import { cva } from "class-variance-authority"


/**
 * Ceramic Tactile buttons (SDD UX §2–§3).
 *
 * Sticker elements: 2px --ink border, flat face color, a single hard offset
 * (zero blur) for depth. Hover raises 2px (offset grows), press depresses to
 * flush (offset collapses). No blurred drop shadows anywhere.
 */
export const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center rounded-lg border-2 border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap outline-none select-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: `${buttonPhysics} border-ink bg-primary text-white shadow-[3px_3px_0_var(--ink)] hover:shadow-[5px_5px_0_var(--ink)] active:shadow-[1px_1px_0_var(--ink)]`,
        secondary: `${buttonPhysics} border-ink bg-secondary text-white shadow-[3px_3px_0_var(--ink)] hover:shadow-[5px_5px_0_var(--ink)] active:shadow-[1px_1px_0_var(--ink)]`,
        outline: `${buttonPhysics} border-ink bg-surface text-ink hover:bg-surface-sunk active:bg-surface-sunk`,
        ghost: `${buttonPhysics} text-ink hover:bg-surface-sunk/70 hover:text-ink`,
        destructive: `${buttonPhysics} border-ink bg-danger text-white shadow-[3px_3px_0_var(--ink)] hover:shadow-[5px_5px_0_var(--ink)] active:shadow-[1px_1px_0_var(--ink)]`,
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-11 gap-1 rounded-[min(var(--radius-sm),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-11 gap-1 rounded-[min(var(--radius-sm),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xl: "h-12 gap-2 px-5 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-sm),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-sm),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
      // Ambient bob + coral glow breathe for key CTAs ("Play", "New Run",
      // a ready Score). Glow is a bloom, not a drop shadow (UX §2 shadow rule).
      pulse: {
        true: "animate-btn-cta hover:animate-none active:animate-none",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      pulse: false,
    },
  }
)


export const loadingCss = "pointer-events-none translate-y-px scale-y-[0.97] brightness-95 saturate-75 shadow-[1px_1px_0_var(--ink)]";

export const flashCss = "overflow-hidden after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-[linear-gradient(105deg,transparent_25%,rgba(255,255,255,0.9)_50%,transparent_75%)] after:animate-btn-flash after:content-['']";
