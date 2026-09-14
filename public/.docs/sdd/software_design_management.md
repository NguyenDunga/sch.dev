# Software Configuration Management: 50/50

Part of the [Software Architecture](software_design_architechture.md). Execution: [Work Management](../prm/execute/execute_work_management.md). Quality: [Quality Management Plan](../prm/plan/plan_quality_management.md).

## Repository Layout (target, post-M1)

The repo root is currently a Node package (sch.dev tooling). Per charter §4, the Vite scaffold is created at the repo root and absorbs the existing `package.json` (keep the `qwen` script; add dev/build/test/lint; replace dependencies with the frozen stack).

```
SCH.DEV/
├── index.html
├── package.json             # scripts: dev / build / test / lint / qwen
├── vite.config.ts
├── tsconfig.json            # strict
├── tailwind.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx              # phase router: menu / run / shop / runEnd
│   ├── core/                # pure — no React, no store, no DOM
│   │   ├── rng.ts
│   │   ├── balance.ts
│   │   ├── scoring.ts
│   │   ├── types.ts
│   │   └── *.test.ts        # vitest, co-located
│   ├── state/
│   │   ├── runStore.ts
│   │   └── runStore.test.ts
│   ├── components/          # shadcn/ui copy-in + game components
│   ├── screens/             # Menu, Run, Shop, RunEnd
│   └── juice/               # animation, ticker, confetti, SFX
├── public/
│   ├── .docs/               # PRM + SDD (this tree)
│   └── resource/            # CC0 SFX assets
└── dist/                    # npm run build output (not committed)
```

## Build & Scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `npm run dev` | Vite dev server | playtest |
| `npm run build` | `tsc && vite build` | local release → `dist/` |
| `npm test` | vitest | core + game-state suite |
| `npm run lint` | ESLint + Prettier | code gate |

## Version Control

- Git, single branch `main` (solo project — no long-lived branches).
- Commit cadence per work package: implement → `tsc` + `npm run lint` → `npm test` → `npm run dev` (playtest) → commit ([Work Management](../prm/execute/execute_work_management.md)).
- Milestone tags M1–M4 at gate exit. No force-push.

## Change Control

| Change type | Approval | Log |
| --- | --- | --- |
| Scope (in/out of scope statement) | BlueCloud | [Scope Management Plan](../prm/plan/plan_scope_management.md) change log |
| Game design (rules, patterns, mechanics) | BlueCloud | scope plan change log |
| Balance values (numbers in `balance.ts`) | none — tunable in playtest | scope plan change log |
| Implementation (refactors, structure, tech within frozen stack) | Qwen decides | commit messages |
| SDD updates | Qwen decides; if it conflicts with the scope statement → BlueCloud | [Architecture](software_design_architechture.md) change log |

## Traceability

SDD ← PRM:

| SDD file | Primary sources |
| --- | --- |
| [Architecture](software_design_architechture.md) | charter §4 (stack), scope statement (product scope) |
| [Component Design](software_design_component.md) | WBS M1–M4, scope statement (pipeline, rules) |
| [Data Design](software_design_data.md) | scope statement (rules), balance-baseline (values) |
| [Configuration Management](software_design_management.md) | work management, quality plan, scope plan |

Charter objectives → SDD coverage:

| Objective | Coverage |
| --- | --- |
| 1 — 1-hour run | component (run structure, 12 blinds), data (blind table) |
| 2 — core loop fun & clear | component (UI, juice, hand flow) |
| 3 — reproducible, shareable runs | data (RNG contract, draw order), architecture (single seeded RNG) |
| 4 — save/resume | data (persistence, resume semantics), architecture |
| 5 — core logic tested | architecture (pure core), management (test gate) |
| 6 — ship on schedule | management (milestone gates, WBS order) |

## Quality Gates (summary)

From [Quality Gates](../prm/plan/plan_quality-gates.md) — nothing exits a milestone on a red gate:

- `tsc` + ESLint + Prettier clean
- vitest 100% green (scope: [Testing Strategy](../prm/plan/plan_testing-strategy.md))
- Playtest checklist 5/5 (M2/M3/M4)
- 60 fps, no jank (M4)
- Balance: full-run win rate 30–50% and average run 45–60 min (M3/M4)

## Release

- Local only: `npm run build` → `dist/`, playable from the dev server or a static serve. No hosting, no Steam (out of scope).
- README (M4): how to run + how to enter/share seeds.
- Seed sharing: the 6–8-char seed string is the whole run identity — paste it into another player's menu to replay the same run (given the same choices).
