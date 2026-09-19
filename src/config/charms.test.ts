// @vitest-environment node
// Charm registry — completeness (every CharmId covered) + blurbs carry their
// own param values (no stale hardcoded numbers).

import { describe, expect, it } from 'vitest'
import { CHARM_CATALOG, CHARMS, charmBlurb } from './charms'
import type { CharmId } from '@/core/types'

const ALL_CHARMS: CharmId[] = ['plusChips', 'plusMult', 'extraHand', 'payday', 'jackpotFever']

describe('CHARMS — completeness', () => {
  it('covers every CharmId with a name, category, price, icon, blurb', () => {
    for (const id of ALL_CHARMS) {
      const c = CHARMS[id]
      expect(c.name).toBeTruthy()
      expect(c.price).toBeGreaterThan(0)
      expect(c.icon.label).toBeTruthy()
      expect(charmBlurb(id)).toBeTruthy()
    }
  })
})

describe('CHARM_CATALOG — the shop catalog', () => {
  it('covers every CharmId with a name + price', () => {
    expect(CHARM_CATALOG).toHaveLength(ALL_CHARMS.length)
    for (const id of ALL_CHARMS) {
      const def = CHARM_CATALOG.find((c) => c.id === id)
      expect(def?.name).toBeTruthy()
      expect(def?.price).toBe(CHARMS[id].price)
    }
  })
})

describe('blurbs carry their own param values', () => {
  it('plusChips / plusMult / extraHand / payday / jackpotFever', () => {
    expect(charmBlurb('plusChips')).toContain(String(CHARMS.plusChips.params.chips))
    expect(charmBlurb('plusMult')).toContain(String(CHARMS.plusMult.params.mult))
    expect(charmBlurb('extraHand')).toContain(String(CHARMS.extraHand.params.hands))
    expect(charmBlurb('payday')).toContain(`$${CHARMS.payday.params.bonus}`)
    expect(charmBlurb('jackpotFever')).toContain(`×${CHARMS.jackpotFever.params.chipsMult}`)
  })
})
