# WBS Overview: 50/50

Milestone → component decomposition. One file per milestone: [M1](plan_wbs-m1-scaffold.md) · [M2](plan_wbs-m2-vertical-slice.md) · [M3](plan_wbs-m3-full-run.md) · [M4](plan_wbs-m4-polish-done.md).

## Tree

```
50/50
├── 1. M1 — Scaffold (2026-09-19)
│   ├── 1.1 Vite + React + TS + Tailwind + shadcn/ui
│   ├── 1.2 Zustand + immer + persist store
│   ├── 1.3 pure-rand seeded RNG wrapper
│   └── 1.4 Vitest setup + npm scripts
├── 2. M2 — Vertical slice (2026-09-19)
│   ├── 2.1 Core: toss + 6-tier pattern scoring + chips×mult (pure, tested)
│   ├── 2.2 UI: hand area, toss animation, score ticker
│   ├── 2.3 Blind loop: 1 blind, 10 hands, target, win/lose
│   └── 2.4 Playtest pass (fun + clear)
├── 3. M3 — Full 12-blind run (2026-09-26)
│   ├── 3.1 Run structure: 4 rounds × 3 blinds, escalating targets
│   ├── 3.2 Boss blinds: 4 fixed rules
│   ├── 3.3 Charms: 5-charm pool, effects, order, drag-to-reorder
│   ├── 3.4 Shop: 5 slots + 1 reroll, economy
│   ├── 3.5 Game over: run end + score summary
│   └── 3.6 Coin deck (Balatro-style): persistent 80-coin collection, finite draw pile per blind (hand shrinks, empty slots count as nothing), per-coin effects (v1 core set of 9), unlimited discard with draw-enchant redraws
└── 4. M4 — Polish & done (2026-10-03)
    ├── 4.1 Seeded runs: short-string seeds, reproducibility tests
    ├── 4.2 Save/resume: manual save to localStorage
    ├── 4.3 Juice: animations, confetti, SFX
    ├── 4.4 Tests green: scoring + RNG 100%
    └── 4.5 Delivery: local build, README, final playtest
```

## Traceability to Charter Objectives

| Charter objective | Components |
| --- | --- |
| 1 — Complete 1-hour run | 3.1, 3.2, 3.5 |
| 2 — Core loop fun & clear | 2.1–2.4, 3.6 |
| 3 — Reproducible, shareable runs | 1.3, 4.1 |
| 4 — Persistence (save/resume) | 1.2, 4.2 |
| 5 — Core logic tested | 1.4, 2.1, 4.4 |
| 6 — Ship on schedule | all milestones |
