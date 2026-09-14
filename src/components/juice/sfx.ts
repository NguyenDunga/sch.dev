// Placeholder — sound map (howler). SDD UX §10 · WBS M13.7. No music.
// Assets live in public/resource/sfx/. Load via howler with a concurrency cap + ducking;
// small events quiet, tier hits / blind clear louder (audio escalation).
export type SfxEvent =
  | 'deal' | 'pick' | 'unpick' | 'discard'
  | 'toss' | 'land' | 'tierHit' | 'chip' | 'mult' | 'cash'
  | 'button' | 'reroll' | 'buy' | 'error'
  | 'winStinger' | 'loseStinger'

export function playSfx(event: SfxEvent): void {
  void event
  // TODO (M13.7): howler playback per the UX §10 sound map (toss/chip use rate variance).
}
