// Ceramic Tactile button physics (SDD UX §3) shared by all chip variants
// (link is exempt):
// hover — raise 2px (the variant's hard offset grows in parallel);
// press — depress to flush (the variant's offset collapses), instant;
// release — springy overshoot back to rest (ease-back ≈ spring-snappy).
// translate is its own CSS property, so the hover raise and press sink
// compose with the variant's shadow without fighting over `transform`.
export const buttonPhysics = [
  "transition-[translate,scale,box-shadow,filter,background-color,border-color,color] duration-200 ease-[var(--ease-back)]",
  "hover:-translate-y-0.5",
  "active:translate-y-[2px] active:duration-0",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:saturate-50 disabled:shadow-none",
].join(" ")
