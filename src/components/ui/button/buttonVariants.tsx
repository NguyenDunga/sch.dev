import { buttonPhysics } from "./buttonPhysics";
import { cva } from "class-variance-authority"


export const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap outline-none select-none focus-visible:ring-3 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: `${buttonPhysics} border-ink/30 bg-gold text-ink shadow-[0_4px_0_0_var(--color-gold-deep),0_10px_18px_-6px_rgba(0,0,0,0.5)] hover:shadow-[0_6px_0_0_var(--color-gold-deep),0_18px_30px_-8px_rgba(0,0,0,0.55)] active:shadow-[0_1px_0_0_var(--color-gold-deep),0_2px_4px_-2px_rgba(0,0,0,0.4)]`,
        secondary: `${buttonPhysics} border-cream-deep/40 bg-cream text-ink shadow-[0_4px_0_0_var(--color-cream-deep),0_10px_18px_-6px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_0_0_var(--color-cream-deep),0_18px_30px_-8px_rgba(0,0,0,0.45)] active:shadow-[0_1px_0_0_var(--color-cream-deep),0_2px_4px_-2px_rgba(0,0,0,0.35)]`,
        outline: `${buttonPhysics} border-border bg-transparent text-foreground shadow-[0_8px_14px_-8px_rgba(0,0,0,0.4)] hover:bg-muted hover:text-foreground hover:shadow-[0_12px_20px_-8px_rgba(0,0,0,0.45)] active:shadow-[0_2px_4px_-2px_rgba(0,0,0,0.35)]`,
        ghost: `${buttonPhysics} text-foreground hover:bg-muted/60 hover:text-foreground`,
        destructive: `${buttonPhysics} border-ember-deep/50 bg-ember text-white shadow-[0_4px_0_0_var(--color-ember-deep),0_10px_18px_-6px_rgba(0,0,0,0.5)] hover:shadow-[0_6px_0_0_var(--color-ember-deep),0_18px_30px_-8px_rgba(0,0,0,0.55)] active:shadow-[0_1px_0_0_var(--color-ember-deep),0_2px_4px_-2px_rgba(0,0,0,0.4)]`,
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xl: "h-12 gap-2 px-5 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
      // Ambient bob + gold glow breathe for key CTAs ("Play", "New Run").
      // Glow keyframes are tuned to the primary (gold) face shadow.
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


export const loadingCss = "pointer-events-none translate-y-px scale-y-[0.97] brightness-95 saturate-75 shadow-[0_1px_0_0_rgba(0,0,0,0.3),0_2px_4px_-2px_rgba(0,0,0,0.35)]";

export const flashCss = "overflow-hidden after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-[linear-gradient(105deg,transparent_25%,rgba(255,255,255,0.9)_50%,transparent_75%)] after:animate-btn-flash after:content-['']";