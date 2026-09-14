# UX / Interaction & Juice Design: 50/50

Part of the [Software Architecture](software_design_architechture.md). Presentation layer over the engine — the counterpart to [Component Design](software_design_component.md) (UI components C5–C10). Balance/rules are locked elsewhere; this file owns **look, feel, motion, and sound**. Goal: a Balatro-grade tactile experience on a flat, low-shadow "ceramic" theme.

## 0. Golden Rule — Juice ↔ Engine Boundary

The engine is instant and deterministic (it resolves a whole hand the moment `score()` is called). **Juice is choreography played over already-computed state (`lastScore`, `RunState`), and it must never mutate state, decide an outcome, or gate an action.**

- The 3D coin flip is *visual*: the engine already set `Slot.face` (M7 `resolveFace`); the animation **always lands on that face**. Physics is decorative — it is nudged/eased to settle on the predetermined result, never the reverse.
- Every celebration is **skippable** (tap / key / click anywhere): skipping jumps to the settled end state and changes **no** number. This preserves the "explicit Score, no auto-score timer" rule (Scope Statement) — the *scoring* isn't timed; the *celebration* is skippable sugar.
- Under `prefers-reduced-motion`, juice degrades to instant/cross-fade (§8) with identical results.

## 1. Feel Principles

1. **Instant response, delayed spectacle.** Input reacts within one frame (hover, press, select); rewards can take longer but never block the next input.
2. **Anticipation → action → settle.** Every meaningful motion has a small wind-up, a punchy move, and an overshoot-settle (spring), not a linear slide.
3. **Everything is physical.** Coins tilt to the cursor, press down when grabbed, spring into slots. Nothing teleports.
4. **Escalation.** Bigger outcomes = bigger, longer, louder (more particles, more shake, higher pitch). Small hits stay quiet so big hits feel huge.
5. **Flat, not realistic.** Depth comes from flat color blocking, thick borders, and a single hard offset — **not** blurred drop shadows (see §2 shadow rule).

## 2. Visual Theme — "Ceramic Tactile" (light, flat)

Warm paper ground, matte ceramic coins, one bold accent, chunky rounded panels. Implemented as CSS custom properties consumed by Tailwind + shadcn/ui; icons via **lucide-react** (2px stroke, rounded).

### Design tokens (`src/index.css` `:root`)

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#F4EFE6` | app background (warm paper) |
| `--surface` | `#FBF8F2` | cards, panels |
| `--surface-sunk` | `#EAE3D6` | wells, empty slots |
| `--ink` | `#2B2724` | primary text + bold borders |
| `--ink-soft` | `#6B635A` | secondary text |
| `--line` | `#DED5C5` | soft panel borders |
| `--primary` / `--primary-press` | `#F0654A` / `#E24E34` | coral — primary actions |
| `--secondary` | `#2FA79B` | teal — secondary/info |
| `--heads` / `--tails` | `#E8B04B` / `#6C8CB5` | coin faces (H gold, T slate-blue) |
| `--cash` | `#3E9C6B` | money |
| `--danger` | `#D9534F` | loss / invalid |
| tier colors | jackpot `#E8B04B` · fourRow `#8B6FC7` · alternating `#2FA79B` · fourSame `#4A82C4` · tripleRun `#5AA469` · threeSame `#9A9086` | tier banners / highlights |

- **Radii:** `--r-sm 8px · --r-md 14px · --r-lg 22px` (chunky).
- **Borders:** interactive "sticker" elements use a **2px `--ink` border**; panels use **1px `--line`**.
- **Shadow rule (explicit):** **no blurred drop shadows.** Depth = a single **hard offset** block (`box-shadow: 3px 3px 0 var(--ink)` style, zero blur) on raised sticker elements only, plus a **glow ring** (`0 0 0 3px color / soft bloom`) on hit/selection. Anything that reads as a soft realistic shadow is banned. Keep it flat.
- **Type:** display/score numerals in a bold rounded face (e.g. Nunito / Fredoka, system-ui bold fallback), tabular-nums; UI text system sans. Scores are **big** and dominate the hierarchy.
- **Spacing scale:** 4 · 8 · 12 · 16 · 24 · 32.

### Motion tokens

| Token | Value | Use |
| --- | --- | --- |
| `ease-out` | `cubic-bezier(0.25, 1, 0.5, 1)` | most exits/moves |
| `ease-back` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | pops / banners (overshoot) |
| `spring-snappy` | stiffness 520, damping 30 | pick/snap, buttons |
| `spring-soft` | stiffness 210, damping 26 | panels, layout shifts |
| `spring-bouncy` | stiffness 420, damping 18 | coin land, banners |
| durations | micro 90ms · quick 160ms · base 240ms · slow 400ms | — |

## 3. Interaction Model (per-element states)

Every interactive element defines **default / hover / active(press) / disabled / selected / focus-visible**. No dead elements.

- **Coin card (in hand):** hover → lift 4px + 3D tilt toward cursor (max 8°) + face-badge brighten; press → depress 2px; pick → springs (`spring-snappy`) into the next play slot; can't-pick (6th) → shake 3px + `error` sfx.
- **Play slot:** empty = sunk well; filled = coin seated; tap a seated coin → springs back to hand.
- **Discard affordance:** drag a hand coin to the discard well *or* long-press; draw-enchant coins show a redraw pip (`+N`); confirm with a satisfying "shhk".
- **Charm chip (bar):** hover lift; drag-to-reorder with momentum (`@dnd-kit`), others slide out of the way (`spring-soft`); drop snaps.
- **Buttons (Score / Confirm / Reroll / Buy / Leave):** hover raise 2px, press depress to flush, `spring-snappy`; disabled = desaturated, no offset, cursor not-allowed. The **Score** button gently pulses when a play is ready.
- **Shop cards:** hover raise + glow ring in the item's tier/accent color; buy → card flies to its destination (charm bar / collection) then removes.
- **Hit targets** ≥ 44px; **focus-visible** = 3px coral ring (keyboard nav supported).

## 4. The 3D Coin (react-three-fiber + drei + rapier)

A single lazy-loaded r3f `<Canvas>` layered over the toss area (transparent, `frameloop="demand"`, DPR cap 2). Coins are **flat-shaded, unlit** so they never read as realistic.

- **Mesh:** low-cylinder (radius 1, height ~0.12), two face materials (H = `--heads`, T = `--tails`) with a flat glyph/emboss texture, thin ridged edge. Material = `MeshBasicMaterial`/toon (unlit); scene has **ambient light only, no directional light, no shadow casting** (upholds the flat/low-shadow rule). Multiple coins use instancing.
- **Flip:** on `confirmPlay`, each coin gets a rapier impulse (upward + angular velocity, small random spin) for a real tumble, then is **guided to settle on `Slot.face`** — physics provides the arc/bounce, a final ease locks the resolved face up (~700–900ms, `spring-bouncy`). *The outcome is never physics-derived.*
- **Echo re-flip:** a quick single-axis re-toss of just that coin, resolving to the new `Slot.face`.
- **Reduced motion / fallback:** a 2D CSS flip (face cross-fade, ~160ms) with no physics and no canvas — same landing face.
- **Perf:** dynamic-import `three`/`@react-three/fiber`/`drei`/`rapier` on entering the Run screen (code-split so Menu/Shop stay light); dispose geometries/materials on unmount; pool coin instances.

## 5. Animation & Timing Table

Named animations (implemented with `motion`/framer-motion unless noted). Trigger → what → duration → curve.

| Name | Trigger | Motion | Dur | Curve |
| --- | --- | --- | --- | --- |
| `deal` | draw phase | coins fly from deck to hand, staggered | 220ms, 40ms stagger | `ease-out` |
| `hover-tilt` | pointer over coin | 3D tilt + 4px lift | 120ms | `spring-snappy` |
| `pick` | pickCoin | coin → play slot | — | `spring-snappy` |
| `unpick` | unpickCoin | coin → hand | — | `spring-soft` |
| `discard` | discard | coin → discard well, fade | 180ms | `ease-out` |
| `toss` | confirmPlay | 3D flip + settle (§4) | 700–900ms | rapier + `spring-bouncy` |
| `echo` | echoReflip | single-coin re-toss | 500ms | `spring-bouncy` |
| `charm-reorder` | drag | neighbours slide | — | `spring-soft` |
| `score-beats` | score | choreography (§6) | ~1.2–2.4s | see §6 |
| `cash-fly` | coin cash | coin icon → cash counter | 250ms each | `ease-back` |
| `blind-clear` | target met | confetti + banner | 1.2s | `ease-back` |
| `screen-in/out` | phase change | slide+fade | 300ms | `spring-soft` |
| `gameover` | lose | desaturate + drop | 500ms | `ease-out` |

## 6. Scoring Choreography (the dopamine loop)

On **Score** tap, play these beats over `lastScore` (skippable — a skip snaps to the end). Budget scales with score size.

1. **Reveal & match** — tossed coins pop in sequence (70ms stagger); coins forming the matched pattern pulse + glow in the tier color; others dim. (`tier_hit` sfx.)
2. **Tier banner** — `"JACKPOT!"` / tier name slams in center, scale 0.6→1 overshoot (`ease-back`, 220ms) + tier-color flash (120ms).
3. **Chips build** — for each contributing coin/charm, a chip particle flies to the **chips** counter; the counter ticks up, `chip` sfx **rising in pitch** per tick. (~500–700ms.)
4. **Mult flare** — the **mult** value pulses and grows, color ramps toward hot; `mult` sfx (~200ms).
5. **Resolve** — chips and mult numbers slide together and collide; the **total** counts up fast (pitch-rising ticker), **screen shake** amplitude scaled to the tier (§7); `--primary` flash on big hits. (~500–900ms.)
6. **Cash** — each Tax/Jackpot coin flips up a coin that flies to the **cash** counter (`cash-fly`, `cash` sfx).
7. **Settle** — numbers settle; Jackpot or target-clear triggers an extra particle burst (and confetti on blind clear).

Beat durations are additive but capped; a second tap during the sequence **fast-forwards** to step 7 instantly.

## 7. Particles & Screen Shake (expanded juice — new scope)

- **Particles:** lightweight (canvas or r3f points). Chip burst 6–12 per hit, coin sparkle ~4 on land, cash coins on payout, **canvas-confetti** 200–300 pieces on blind clear. Colors pulled from the active tier / theme tokens.
- **Screen shake:** translate the run root a few px with exponential decay; amplitude by tier — threeSame 2px · tripleRun/fourSame 3–4px · alternating/fourRow 5–6px · **jackpot 8px** · target-clear 10px; decay 250–350ms. **Zero under reduced-motion.**
- **Feedback via light, not shadow:** hits use color flashes and glow rings (§2), never blurred shadows.

## 8. Reduced Motion & Accessibility

- `prefers-reduced-motion: reduce` → 3D flips become 2D cross-fades; **no** screen shake; particles minimal or off; counters tick fast (≤150ms) instead of long; no hover tilt. Same final state and numbers.
- **Colorblind-safe H/T:** never color alone — Heads/Tails carry a glyph/letter (H·T) and distinct shape, not just gold vs blue.
- Focus-visible rings, full keyboard path (select coins, confirm, score, shop), ARIA labels on coins/charms, hit targets ≥ 44px, respects OS text scaling.

## 9. Performance Budget

- **60fps** on a normal laptop for toss + choreography + confetti (charter quality standard).
- Single r3f canvas, instanced coins, `frameloop="demand"`; **code-split** `three`/r3f/rapier so only the Run screen pays for them; dispose on unmount; DPR cap 2.
- Choreography and particles must never block input; skipping always available. Audio via howler with a concurrency cap + ducking (no clip pile-ups on fast play).

## 10. Sound Map (expanded SFX — flat, no music)

howler; CC0 assets in `public/resource/sfx/`. **No music** (charter). Expanded beyond the original toss/win/lose set (logged scope change).

| Event | Sfx | Note |
| --- | --- | --- |
| draw/deal | `deal` | per hand |
| pick / unpick | `pick` / `unpick` | short clicks |
| discard | `discard` | "shhk" |
| coin toss / land | `toss` / `land` | per coin, playback rate ±5% random |
| tier hit | `tier_hit` | pitch/variant by tier rank |
| chip tick | `chip` | **rate rises with tick index** |
| mult flare | `mult` | — |
| cash | `cash` | per cash coin |
| button / reroll / buy | `button` / `reroll` / `buy` | tactile |
| invalid | `error` | e.g. 6th pick |
| blind clear | `win_stinger` | with confetti |
| game over | `lose_stinger` | — |

Mix: SFX bus with a concurrency cap; quieter small events, louder tier/clear so escalation reads in audio too.

## Change Log

| Date | Change | Approved by | Reason |
| --- | --- | --- | --- |
| 2026-09-14 | UX/Juice design baseline v1.0: Ceramic Tactile flat theme (low-shadow), tactile interaction model, r3f/drei/rapier flat-shaded 3D coin, scoring choreography, particles + screen shake, expanded SFX set, reduced-motion/a11y, perf budget | BlueCloud | UX build-out — "Balatro-grade smoothness"; expands the juice scope + theme (see scope plan change log) |
