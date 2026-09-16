# 50/50

A Balatro-style coin-toss roguelike. Match patterns with tossed coins to score chips × mult across 12 escalating blinds. Build your deck with charms, special coins, and shop upgrades.

**Single-player, local, no account. Fully deterministic — share a seed to replay any run.**

## Quick Start

```bash
# Install dependencies
npm install

# Dev server (hot reload)
npm run dev

# Production build
npm run build
npm run preview   # serve the built output locally

# Tests (424 tests, ~50s)
npm test

# Lint + type-check
npm run lint
npx tsc --noEmit
```

Requires **Node 18+** (uses `crypto.getRandomValues`).

## How to Play

1. **Menu** — enter a seed (6–8 alphanumeric chars) or click the dice for a random one. Start a run.
2. **Run screen** — you get 4 hands per blind (10 hands on the base budget). Each hand:
   - **Draw**: 8 face-down coins auto-draw into your hand.
   - **Play**: drag (or number-key 1–0) coins to the 5-slot play row. Drag to the discard well (or press **D** on a focused coin) to discard.
   - **Toss**: press **Enter** (or the Confirm button) — picked coins arc up and land on Heads or Tails.
   - **Buff**: if a landed coin has an **Echo** effect, tap it to re-flip once.
   - **Score**: press **Space** (or the Score button) — the 7-beat scoring choreography plays. (Auto-scores when nothing is left to do.)
3. **Shop** (between blinds) — buy charms, special coins, or a hand-size upgrade. Merge coins (drag one onto another). Reroll offers once. Leave to the next blind.
4. **Win** — clear all 12 blinds (4 rounds × 3: Small, Big, Boss). **Lose** — miss a blind's target.

### Scoring Tiers (highest priority wins)

| Tier | Pattern | Chips × Mult |
| --- | --- | --- |
| **Jackpot** | 5 identical | 50 × 5 |
| **Four Row** | 4 adjacent identical | 40 × 4 |
| **Alternating** | 5 strictly alternating (HTHTH) | 30 × 4 |
| **Four Same** | 4 of a face (any position) | 25 × 3 |
| **Triple Run** | 3 adjacent identical | 20 × 2 |
| **Three Same** | 3 of a face (any position) | 15 × 1 |

Coin effects (Weight, Double-Side, Chaos, Magnetic, Reverse, Tax, Jackpot, Draw, Echo) modify face odds or pay cash. Charms (Plus Chips, Plus Mult, Extra Hand, Payday, Jackpot Fever) boost scoring.

## Seed Sharing

Every run is fully deterministic from its seed. To share a run:

- **Copy the seed** — shown on the run-end screen (and in the menu). It's a 6–8 character alphanumeric string.
- **Enter it** — paste into the seed field on the menu before starting a new run. Same seed + same choices = identical run.

The seed is the *only* input needed to reproduce a run. No account, no server.

## Save / Resume

- **Manual save** — the Save button (top-right, run screen) writes the run to `localStorage`.
- **Resume** — the menu shows a Resume button when a save exists. Restores the exact state (blind, hand, collection, cash, RNG position).
- Saves are **explicit only** (no autosave). One save slot. Closing the browser and reopening resumes from the last save.

## Project Structure

```
src/
  core/          # Pure engine: RNG, deck, scoring, balance, types
  state/         # Zustand store: hand machine, shop, save/resume
  components/    # UI: hand, run, shop, juice (choreography, particles, shake, sfx)
  pages/         # Screens: menu, run, shop, run-end
  lib/           # Shared: icon registry, motion tokens, onboarding
public/
  resource/sfx/  # 16 synthesized .wav sound effects (CC0, generated)
  .docs/         # Project docs (WBS, SDD, plans)
```

## Tech Stack

- **Vite + React 19 + TypeScript** (strict)
- **Zustand + Immer** (state)
- **Framer Motion** (animation — `animate()`, springs, `MotionConfig reducedMotion="user"`)
- **dnd-kit** (drag-and-drop)
- **Howler** (sound)
- **lucide-react** + custom SVGs (icons)
- **Tailwind CSS + shadcn/ui** (styling — Ceramic Tactile theme)
- **Vitest + Testing Library** (424 tests)

## Accessibility

- Full keyboard path (number keys, D, Enter, Space, Tab)
- `prefers-reduced-motion` respected (all animations degrade to fades/no-ops)
- Colorblind-safe (icon shape primary, color secondary)
- ARIA labels on all interactive elements
- Hit targets ≥ 44px

## License

MIT
