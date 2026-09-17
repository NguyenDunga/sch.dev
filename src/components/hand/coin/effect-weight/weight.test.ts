// Weight effect tests.
import { describe, expect, it } from 'vitest'
import { resolveWeight, WEIGHT_META, WEIGHT_VALUES, type WeightEffect } from './weight-config'
import { weightResolver } from './weight-resolver'

const wH: WeightEffect = { kind: 'weight', favored: 'H' }
const wT: WeightEffect = { kind: 'weight', favored: 'T' }

describe('weight effect', () => {
  it('meta: kind, name, priority', () => {
    expect(WEIGHT_META.kind).toBe('weight')
    expect(WEIGHT_META.name).toBe('Weight')
    expect(WEIGHT_META.priority).toBe(2)
  })

  it('H favored, H face: favored color', () => {
    const m = resolveWeight(wH, 'H')
    expect(m.color).toBe(WEIGHT_VALUES.colorFavored)
  })

  it('H favored, T face: no modifier', () => {
    const m = resolveWeight(wH, 'T')
    expect(m).toEqual({})
  })

  it('T favored, T face: favored color', () => {
    const m = resolveWeight(wT, 'T')
    expect(m.color).toBe(WEIGHT_VALUES.colorFavored)
  })

  it('T favored, H face: no modifier', () => {
    const m = resolveWeight(wT, 'H')
    expect(m).toEqual({})
  })

  it('resolver delegates to config', () => {
    expect(weightResolver(wH, 'H')).toEqual(resolveWeight(wH, 'H'))
  })
})
