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

  it('H favored, H face: tilt right + color', () => {
    const m = resolveWeight(wH, 'H')
    expect(m.tilt).toBe(12)
    expect(m.color).toBe(WEIGHT_VALUES.colorFavored)
  })

  it('H favored, T face: tilt left (opposite)', () => {
    const m = resolveWeight(wH, 'T')
    expect(m.tilt).toBe(-4)
  })

  it('T favored, T face: tilt left + color', () => {
    const m = resolveWeight(wT, 'T')
    expect(m.tilt).toBe(-12)
    expect(m.color).toBe(WEIGHT_VALUES.colorFavored)
  })

  it('T favored, H face: tilt right (opposite)', () => {
    const m = resolveWeight(wT, 'H')
    expect(m.tilt).toBe(4)
  })

  it('resolver delegates to config', () => {
    expect(weightResolver(wH, 'H')).toEqual(resolveWeight(wH, 'H'))
  })
})
