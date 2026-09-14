# M12 — UI Screens, Theme & Interaction

**Depends:** M1–M11 · **Files:** `src/index.css` (theme tokens), `src/App.tsx` (phase router), `src/pages/` (menu, run, shop, run-end), `src/components/` (coin, hand, charm bar, buttons, coin3d) · **Source of truth:** [SDD UX / Interaction & Juice](../../sdd/software_design_ux.md) §2–§4, §8; [Component Design](../../sdd/software_design_component.md) C5–C9 · Conventions: [overview](plan_wbs-overview.md).

*Goal: wire the store to screens on the "Ceramic Tactile" flat theme, with tactile per-element interaction and the flat-shaded 3D coin. UI is a thin layer — components read `RunState` and call store actions; no game logic in components. Build all feel details to the UX doc (it holds the tokens, states, and timings).*

## Checkpoints

- [x] 12.1 **Theme tokens** — implement the Ceramic Tactile palette, radii, borders, motion tokens, and the **no-blur-shadow rule** from [UX §2](../../sdd/software_design_ux.md) as CSS vars in `src/index.css`; wire Tailwind + shadcn/ui to them; install **lucide-react** for icons (2px stroke). *Done when:* a token audit shows no blurred `box-shadow` (only hard offset / glow) anywhere.
- [x] 12.2 **App router** — `App.tsx` renders by `RunState.phase` (menu/run/shop/runEnd) with the `screen-in/out` transition (UX §5).
- [x] 12.3 **Menu (C5)** — title, seed field (6–8 chars) + random-seed button (`generateSeed`), New Run, Resume (only when a save exists).
- [x] 12.4 **Coin component + interaction states** — hand coin with hover tilt/lift, press, selected, disabled per [UX §3](../../sdd/software_design_ux.md); face badge (H/T glyph + color, colorblind-safe); `pickCoin`/`unpickCoin` spring into/out of play slots; 6th-pick → shake + `error`.
- [x] 12.5 **3D coin (C10 shared)** — a 3D coin over the toss area that tumbles and **settles on `Slot.face`** per [UX §4](../../sdd/software_design_ux.md); 2D cross-fade fallback under reduced-motion. *Deviation:* built with **CSS 3D transforms** (a two-face disc: `rotateX` tumble + `translateY` arc, `preserve-3d` + `backface-visibility`), **not r3f/rapier** — fiber v9 won't install on React 19.3 (caps `<19.3`), and CSS is inherently flat + unlit, so it upholds "never reads as realistic" with zero WebGL/WASM and a jsdom-testable path. Outcome is never animation-derived (face resolved in the store). Toss 700–900 ms, staggered left→right.
- [x] 12.6 **Run screen (C6)** — Draw/Play: face-down hand, pick 1–5, discard (draw-enchant redraw pip), blind header (round, target, blindScore, handsLeft, draw-pile count). Toss/Buff: 3D flip, Echo re-flip (once per Echo coin), charm bar (C7) drag-to-reorder → `moveCharm`. Score: explicit **Score** button (pulses when ready) → `score`; tier/base/boosters breakdown.
- [x] 12.7 **Shop screen (C8)** — 5 offer cards (hover raise + tier glow), Reroll (disabled after first use), Merge + Remove, collection view, cash, Leave.
- [x] 12.8 **Run-end (C9)** — win/lose, run summary (blinds cleared, runScore, cash), seed shown for sharing, Menu.
- [x] 12.9 **Manual Save** button on Run → `save`; no autosave.
- [ ] 12.10 **Tactile controls pass** — every button/slot/card has default/hover/active/disabled/selected/focus-visible states (UX §3); hit targets ≥44px; keyboard path works.
- [ ] 12.11 **Smoke tests** — each screen renders from a valid `RunState` without throwing (the r3f canvas is mockable/skipped in jsdom).

## Exit gate

`npm test` green incl. smoke tests; every screen renders from a valid `RunState`; a full run is playable end-to-end; theme audit shows flat/low-shadow; all interactive elements have their full state set. (Charter M3: playtest 5/5.) Juice choreography/particles/SFX land in M13.
