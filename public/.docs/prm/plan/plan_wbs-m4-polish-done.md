# M4 — Polish & Done (target 2026-10-03)

Goal: ship-quality local build — reproducible, savable, juicy, tested.

| ID | Component | Done means |
| --- | --- | --- |
| 4.1 | Seeded runs | Short-string seed (6–8 chars) on menu; entering a seed → identical run; reproducibility verified by tests |
| 4.2 | Save/resume | Manual save to localStorage (zustand persist); resume verified across sessions (close → reopen → continue) |
| 4.3 | Juice | Coin-toss animation, chips×mult ticker, confetti on blind clear (canvas-confetti), SFX via howler (toss, win/lose stingers) — no music |
| 4.4 | Tests green | vitest suite (scoring + RNG) 100% passing |
| 4.5 | Delivery | `npm run build` works locally; README (how to run + enter/share seeds); final playtest of a full run |

## M4 Acceptance (project "done")

- [ ] `npm run build` works; full 12-blind run playable start to finish
- [ ] vitest suite (scoring + RNG) 100% green; seeded runs verified reproducible
- [ ] README complete; manual save/resume verified across sessions
- [ ] All 4 boss rules, all 5 charms, coin deck (discard + draw-enchant redraws + coin effects), shop + reroll + merge/remove work end to end

Charter milestone: M4.
