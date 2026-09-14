# Testing Strategy: 50/50

Part of the [Quality Management Plan](plan_quality_management.md). Runner: vitest (free with Vite). Depth: **core + game state**.

## What Is Tested

### Core (pure functions)

- 6-tier pattern detection — every tier + highest-value-wins priority (e.g. HHHHH is also a 4-in-a-row and a triple-run, scores as Jackpot)
- Boss rule effects on scoring (No Alternating, No Jackpots, Heavy Target)
- Charm effects on scoring (all 9), including left-to-right order dependency
- chips × mult computation
- Seeded RNG: same seed → same sequence; different seed → different sequence

### Game state (zustand store)

- Blind progression: small → big → boss → next round, 12 blinds total
- Miss target → game over (run ends)
- Shop: 5 offers, no duplicates of owned, reroll, purchase updates cash
- Economy: blind rewards only, starting cash $4
- Save/restore round-trip: serialize → restore → identical state

## What Is Not Tested (mandate)

- UI components (React rendering, drag-to-reorder) — verified in playtest
- SFX / confetti — verified in playtest

## Pass Criteria

- `npm test` 100% passing — hard gate at every milestone exit
- No coverage mandate on UI; core + game state fully covered
