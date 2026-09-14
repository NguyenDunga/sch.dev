# M2 — Vertical Slice (target 2026-09-19)

Goal: playable 1-blind loop — toss 1–5 coins from the Balatro-style coin deck, score by pattern (empty slots count as nothing — pattern on the tossed coins only), chips×mult, clear or fail. Proves core fun (charter objective 2, assumption §9). The slice is built on the 2026-09-13 Q&A round 2 deck design (WBS 3.6); the full 12-blind integration lands in M3.

| ID | Component | Done means |
| --- | --- | --- |
| 2.1 | Core: coin deck + scoring | Pure functions: coin collection (base 80), draw pile / discard pile, face resolution (odds stage → roll → Reverse; Echo re-flip), 6-tier pattern detection on the tossed coins only (empty slots count as nothing; short plays can only match tiers that fit their length), chips×mult, coin cash (Tax/Jackpot); unit tests for all 6 tiers, short-hand tier limits, face effects, and highest-value-wins priority rule |
| 2.2 | Hand UI | Hand area showing up to 5 coins; toss animation (framer-motion); effect badges; echo re-flip + unlimited discard affordances; chips×mult ticker (framer-motion) |
| 2.3 | Blind loop | 1 blind with target (draft: 300), 10 hands, finite draw pile (hand shrinks on deck-out); explicit Score button (no auto-score); win → blind cleared / miss → game over (run-end screen with seed) |
| 2.4 | Playtest pass | 10-min playtest: pattern scoring + loop feel fun and clear; notes logged, tuning applied |

**Exit criteria:** a stranger can play one blind start to finish without explanation; scoring tests green.

Charter milestone: M2.
