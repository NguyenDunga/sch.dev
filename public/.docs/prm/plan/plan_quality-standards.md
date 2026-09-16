# Quality Standards: 50/50

Part of the [Quality Management Plan](plan_quality_management.md). Baseline: quality Q&A (2026-09-12).

| Area | Standard |
| --- | --- |
| Code | TypeScript strict mode; ESLint + Prettier clean (`npm run lint`); no `any` outside external boundaries |
| Tests | vitest suite 100% passing; scope in [testing-strategy](plan_testing-strategy.md) |
| Performance | 60fps, no jank — coin-toss animation, chips×mult ticker, confetti on a normal laptop; verified via DevTools performance tab at M4 |
| UX | 5-item playtest checklist, all pass, at M2/M3 ([playtest-protocol](plan_playtest-protocol.md)) |
| Balance | Full-run win rate 30–50% AND average run 45–60 min ([playtest-protocol](plan_playtest-protocol.md)) |
| Reproducibility | Same seed → identical run, verified by tests (charter objective 3) |
