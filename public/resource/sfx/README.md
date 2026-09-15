# SFX assets (CC0)

Required per the [UX sound map](../../.docs/sdd/software_design_ux.md) §10 (WBS M13.7). Played through howler (`src/components/juice/sfx.ts`); **no music**.

All 16 files are **synthesized** (mono 16-bit PCM .wav, 22.05 kHz) by
`scripts/generate-sfx.mjs` — generated, hence CC0, no external assets:

```
node scripts/generate-sfx.mjs
```

One file per event key:

- `deal`, `pick`, `unpick`, `discard`
- `toss`, `land`
- `tierHit` (pitch/variant by tier rank via the howler `rate`)
- `chip`, `mult`, `cash`
- `button`, `reroll`, `buy`
- `error`
- `winStinger` (blind clear), `loseStinger` (game over)

Design: small events quiet + short; tier hits and the blind-clear stinger
loud, so the escalation reads in audio too (UX §10).
