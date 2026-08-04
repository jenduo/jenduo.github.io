import { describe, expect, it } from 'vitest'
import { falloff, pulseRadius, radiusAt, spotlightRows } from './glitch'
import type { Spotlight } from './glitch'

/** Always glitches wherever the chance is above zero. */
const always = () => 0
/** Never glitches: no chance is above 1. */
const never = () => 1

const spot = (over: Partial<Spotlight> = {}): Spotlight => ({
  col: 0,
  row: 0,
  radius: 5,
  aspect: 2,
  ...over,
})

describe('falloff', () => {
  it('is strongest at the centre', () => {
    expect(falloff(0, 5)).toBe(1)
  })

  it('decays with distance', () => {
    expect(falloff(1, 5)).toBeGreaterThan(falloff(4, 5))
  })

  it('is zero at and beyond the radius', () => {
    expect(falloff(5, 5)).toBe(0)
    expect(falloff(50, 5)).toBe(0)
  })

  it('is zero for a zero radius rather than dividing by it', () => {
    expect(falloff(0, 0)).toBe(0)
  })
})

describe('radiusAt', () => {
  it('starts at the small end', () => {
    expect(radiusAt(0, 2, 14, 20)).toBe(2)
  })

  it('grows monotonically', () => {
    const values = [0, 5, 10, 15, 20].map((frame) => radiusAt(frame, 2, 14, 20))
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1])
    }
  })

  it('reaches the large end exactly', () => {
    expect(radiusAt(20, 2, 14, 20)).toBe(14)
  })

  // Hovering for a long time must hold steady, not keep expanding forever.
  it('holds at the large end past the growth window', () => {
    expect(radiusAt(500, 2, 14, 20)).toBe(14)
  })

  it('clamps a negative frame to the small end', () => {
    expect(radiusAt(-5, 2, 14, 20)).toBe(2)
  })

  it('returns the large end for a zero-length window rather than dividing by it', () => {
    expect(radiusAt(0, 2, 14, 0)).toBe(14)
  })
})

describe('pulseRadius', () => {
  const from = 2
  const to = 70
  const grow = 20
  const collapse = 12
  const period = grow + collapse
  const at = (tick: number) => pulseRadius(tick, from, to, grow, collapse)

  it('starts collapsed', () => {
    expect(at(0)).toBe(from)
  })

  it('peaks at the end of the growth phase', () => {
    expect(at(grow)).toBe(to)
  })

  it('grows through the growth phase', () => {
    expect(at(5)).toBeLessThan(at(15))
  })

  it('collapses after the peak', () => {
    expect(at(grow + 6)).toBeLessThan(to)
    expect(at(grow + 11)).toBeLessThan(at(grow + 6))
  })

  it('returns to the start by the end of the period', () => {
    expect(at(period)).toBe(from)
  })

  // The whole point: it revives rather than settling once collapsed.
  it('repeats every period', () => {
    for (const tick of [0, 3, grow, grow + 5]) {
      expect(at(tick + period), `tick ${tick}`).toBeCloseTo(at(tick))
      expect(at(tick + period * 4), `tick ${tick}`).toBeCloseTo(at(tick))
    }
  })

  it('never leaves the range', () => {
    for (let tick = 0; tick < period * 3; tick++) {
      expect(at(tick)).toBeGreaterThanOrEqual(from)
      expect(at(tick)).toBeLessThanOrEqual(to)
    }
  })

  it('handles a zero-length period rather than dividing by it', () => {
    expect(pulseRadius(3, from, to, 0, 0)).toBe(to)
  })
})

describe('spotlightRows', () => {
  it('returns rows untouched with no spotlight', () => {
    const rows = ['abc', 'def']
    expect(spotlightRows(rows, null, always)).toBe(rows)
  })

  // The banner sits on a character grid. A row that changed length would shear
  // the lettering apart, which is the failure mode this guards.
  it('never changes the length of a row', () => {
    const rows = ["| '_ \\| | | | __|// __|", '|_| |_|_| |_|\\__| |___/']
    const out = spotlightRows(rows, spot({ col: 10, row: 0, radius: 40 }), always)
    expect(out.map((row) => row.length)).toEqual(rows.map((row) => row.length))
  })

  it('leaves spaces alone so the silhouette survives', () => {
    const row = 'ab  cd  ef'
    const [out] = spotlightRows([row], spot({ col: 5, radius: 40 }), always)
    for (let i = 0; i < row.length; i++) {
      if (row[i] === ' ') expect(out[i], `index ${i}`).toBe(' ')
    }
  })

  it('scrambles at the cursor', () => {
    const [out] = spotlightRows(['abcdef'], spot({ col: 0, radius: 5 }), always)
    expect(out[0]).not.toBe('a')
  })

  // The whole point of the radius: distant characters must be left alone.
  it('leaves characters beyond the radius untouched', () => {
    const row = 'abcdefghijklmnopqrstuvwxyz'
    const [out] = spotlightRows([row], spot({ col: 0, radius: 4 }), always)
    expect(out.slice(4)).toBe(row.slice(4))
  })

  it('changes nothing when the roll always fails', () => {
    const rows = ['abcdef']
    expect(spotlightRows(rows, spot({ radius: 40 }), never)).toEqual(rows)
  })

  // Cells are about twice as tall as they are wide, so a row of vertical
  // distance must cost more reach than a column of horizontal distance.
  it('reaches further sideways than vertically', () => {
    const grid = ['aaaaa', 'aaaaa', 'aaaaa']
    const centre = { col: 0, row: 0, radius: 2.5, aspect: 2 }
    const [top, next] = spotlightRows(grid, centre, always)
    // Two columns across is within reach; two rows down is not.
    expect(top[2]).not.toBe('a')
    expect(next[2]).toBe('a')
  })

  it('only emits its own charset or the original character', () => {
    const row = 'abc def'
    const [out] = spotlightRows([row], spot({ col: 3, radius: 40 }), always)
    for (let i = 0; i < row.length; i++) {
      const kept = out[i] === row[i]
      const glitched = '!<>_/\\[]{}=+*^?#$%&|~'.includes(out[i])
      expect(kept || glitched, out[i]).toBe(true)
    }
  })
})
