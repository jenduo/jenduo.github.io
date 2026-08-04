import { describe, expect, it } from 'vitest'
import { glitchIntensity, glitchRow, glitchRows } from './glitch'

/** Always glitches: 0 is never >= a positive intensity. */
const always = () => 0
/** Never glitches: 1 is always >= an intensity below 1. */
const never = () => 1

describe('glitchRow', () => {
  // The banner sits on a character grid. A row that changes length would shear
  // the lettering apart, which is the whole failure mode this guards.
  it('never changes the length of a row', () => {
    const row = "| '_ \\| | | | __|// __|"
    expect(glitchRow(row, 0.5, always)).toHaveLength(row.length)
    expect(glitchRow(row, 0.5, never)).toHaveLength(row.length)
  })

  it('leaves spaces alone so the silhouette survives', () => {
    const row = 'ab  cd  ef'
    const out = glitchRow(row, 1, always)
    for (let i = 0; i < row.length; i++) {
      if (row[i] === ' ') expect(out[i], `index ${i}`).toBe(' ')
    }
  })

  it('returns the row untouched at zero intensity', () => {
    const row = '|_| |_|_|'
    expect(glitchRow(row, 0, always)).toBe(row)
  })

  it('replaces non-space characters when the roll always passes', () => {
    expect(glitchRow('ab', 1, always)).not.toBe('ab')
  })

  it('replaces nothing when the roll always fails', () => {
    expect(glitchRow('ab', 0.5, never)).toBe('ab')
  })

  it('only ever emits characters from its own charset or the original', () => {
    const row = 'abc def'
    const out = glitchRow(row, 1, always)
    for (let i = 0; i < row.length; i++) {
      const isOriginal = out[i] === row[i]
      const isGlitch = '!<>_/\\[]{}=+*^?#$%&|~'.includes(out[i])
      expect(isOriginal || isGlitch, out[i]).toBe(true)
    }
  })
})

describe('glitchRows', () => {
  it('preserves the row count and every row length', () => {
    const rows = ['abc', 'de', '']
    const out = glitchRows(rows, 0.5, always)
    expect(out).toHaveLength(3)
    expect(out.map((row) => row.length)).toEqual([3, 2, 0])
  })
})

describe('glitchIntensity', () => {
  it('starts strong', () => {
    expect(glitchIntensity(0, 10)).toBeGreaterThan(0.4)
  })

  it('decays monotonically', () => {
    const values = [0, 2, 4, 6, 8].map((frame) => glitchIntensity(frame, 10))
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThan(values[i - 1])
    }
  })

  // Reaching exactly zero is what ends the animation and restores the art.
  it('reaches zero at the end and stays there', () => {
    expect(glitchIntensity(10, 10)).toBe(0)
    expect(glitchIntensity(99, 10)).toBe(0)
  })
})
