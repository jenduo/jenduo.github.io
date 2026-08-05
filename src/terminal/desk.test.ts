import { describe, expect, it } from 'vitest'
import { DRIFT_PERIOD, driftDelay } from './desk'

describe('driftDelay', () => {
  // Negative, so the animation starts part-way in rather than waiting.
  it('is a negative offset into the cycle', () => {
    expect(driftDelay(100, () => 0.25)).toBe('-25.0s')
  })

  it('stays inside one period, so the phase is reachable', () => {
    for (const value of [0, 0.5, 0.999]) {
      const seconds = Number(driftDelay(DRIFT_PERIOD, () => value).replace(/[-s]/g, ''))
      expect(seconds).toBeGreaterThanOrEqual(0)
      expect(seconds).toBeLessThan(DRIFT_PERIOD)
    }
  })

  it('trims to a tenth, since CSS gains nothing from more', () => {
    expect(driftDelay(10, () => 1 / 3)).toBe('-3.3s')
  })

  // Rounding up to the period would be the same as no offset at all.
  it('never reaches the period, even on a draw just short of it', () => {
    expect(driftDelay(22, () => 0.9999)).toBe('-21.9s')
  })
})
