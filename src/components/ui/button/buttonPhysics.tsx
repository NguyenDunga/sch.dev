// Balatro-style physical feel shared by all chip variants (link is exempt):
// idle — solid bottom edge + ambient shadow (per-variant colors);
// hover — springy scale-up, brightness pop, 1-2° wobble, shadow grows;
// press — instant squash (scaleY .92) + sink, shadow collapses (duration-0);
// release — springy overshoot back to rest.
// scale / translate / rotate are separate CSS properties, so hover scale,
// wobble and press squash compose without fighting over `transform`.
export const buttonPhysics = [
  "transition-[transform,translate,scale,rotate,box-shadow,filter,background-color,border-color,color] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
  "hover:scale-105 hover:brightness-110 hover:animate-btn-wobble",
  "active:scale-y-[0.92] active:translate-y-[3px] active:brightness-95 active:duration-0",
  "disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50 disabled:shadow-none",
].join(" ")
