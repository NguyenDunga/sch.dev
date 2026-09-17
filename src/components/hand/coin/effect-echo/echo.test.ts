import { describe, expect, it } from 'vitest'
import { resolveEcho, ECHO_META } from './echo-config'
import { echoResolver } from './echo-resolver'
describe('echo effect', () => {
  it('meta', () => { expect(ECHO_META.priority).toBe(5) })
  it('glow + class', () => {
    const m = resolveEcho()
    expect(m.glow).toContain('var(--secondary)')
    expect(m.customClass).toBe('coin-face--echo')
  })
  it('resolver delegates', () => { expect(echoResolver()).toEqual(resolveEcho()) })
})
