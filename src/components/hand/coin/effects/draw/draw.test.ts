import { describe, expect, it } from 'vitest'
import { resolveDraw, DRAW_META, type DrawEffect } from './draw-config'
import { drawResolver } from './draw-resolver'
const d1: DrawEffect = { kind: 'draw', count: 1 }
const d2: DrawEffect = { kind: 'draw', count: 2 }
const d3: DrawEffect = { kind: 'draw', count: 3 }
describe('draw effect', () => {
  it('meta', () => { expect(DRAW_META.priority).toBe(10) })
  it('count 1: three-same border', () => {
    expect(resolveDraw(d1).border).toContain('var(--tier-three-same)')
  })
  it('count 2: triple-run border', () => {
    expect(resolveDraw(d2).border).toContain('var(--tier-triple-run)')
  })
  it('count 3: jackpot border', () => {
    expect(resolveDraw(d3).border).toContain('var(--tier-jackpot)')
  })
  it('resolver delegates', () => { expect(drawResolver(d1)).toEqual(resolveDraw(d1)) })
})
