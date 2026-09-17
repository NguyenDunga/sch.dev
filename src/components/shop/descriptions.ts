// Shop offer descriptions (C8) — short, plain-language blurbs for the coin
// effects and charms shown on the offer cards. Data only (no logic).

import type { CharmId, CoinEffectId } from '@/core/types'

/** One-line coin-effect descriptions (the 13 catalog entries). */
export const COIN_DESCRIPTIONS: Record<CoinEffectId, string> = {
  weight: '75% chance of a favoured face (rolled at purchase)',
  heads: 'Always lands on Heads',
  tails: 'Always lands on Tails',
  facedown: 'Special face-down display in hand (no gameplay change)',
  chaos: 'Random face every toss',
  echo: 'Re-flip once during the buff',
  magnetic: '75% chance to match the left coin',
  reverse: 'Flips the resolved face',
  tax: '+$1 cash every hand',
  jackpot: '25% chance of +$4 cash',
  draw1: 'Discarding redraws 1 coin',
  draw2: 'Discarding redraws 2 coins',
  draw3: 'Discarding redraws 3 coins',
}

/** One-line charm descriptions (the 5 charms). */
export const CHARM_DESCRIPTIONS: Record<CharmId, string> = {
  plusChips: '+10 chips at score',
  plusMult: '+1 mult at score',
  extraHand: '+1 hand per blind',
  payday: '+$5 blind reward',
  jackpotFever: '×2 mult on a Jackpot hand',
}
