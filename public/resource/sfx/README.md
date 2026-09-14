# SFX assets (CC0)

Required per the [UX sound map](../../.docs/sdd/software_design_ux.md) §10 (WBS M13.7). Played through howler; **no music**.

Drop short CC0 `.wav` / `.mp3` files here, one per event key used in `src/components/juice/sfx.ts`:

- `deal`, `pick`, `unpick`, `discard`
- `toss`, `land`
- `tierHit` (or per-tier variants)
- `chip`, `mult`, `cash`
- `button`, `reroll`, `buy`, `error`
- `winStinger`, `loseStinger`

Keep small events quiet and short; make tier hits and the blind-clear stinger louder so the escalation reads in audio too (UX §10).
