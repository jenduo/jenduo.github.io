import { describe, expect, it } from 'vitest'
import { falloff, spotlightRows } from './glitch'
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
