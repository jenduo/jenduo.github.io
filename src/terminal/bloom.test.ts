import { describe, expect, it } from 'vitest'
import { bloomRow, bloomsIn } from './bloom'

const text = (segments: ReturnType<typeof bloomRow>) =>
  segments.map((segment) => ('text' in segment ? segment.text : segment.glyph)).join('')

describe('bloomRow', () => {
  it('leaves a row with no blooms in one piece', () => {
    expect(bloomRow('(_)', [])).toEqual([{ text: '(_)' }])
  })

  // The bloomed cell replaces a character rather than adding one, or every row
  // after it would sit a column further right than the art it belongs to.
  it('replaces the character, keeping the row the same width', () => {
    const row = '| |__ (_) (_)'
    const out = bloomRow(row, [{ row: 1, col: 7, glyph: '✿' }])
    expect(text(out)).toHaveLength(row.length)
    expect(text(out)).toBe('| |__ (✿) (_)')
  })

  it('puts each bloom in its own segment, so it can be coloured apart', () => {
    const out = bloomRow('(_) (_)', [
      { row: 0, col: 1, glyph: '✿' },
      { row: 0, col: 5, glyph: '❀' },
    ])
    expect(out).toEqual([
      { text: '(' },
      { glyph: '✿' },
      { text: ') (' },
      { glyph: '❀' },
      { text: ')' },
    ])
  })

  it('blooms in column order however they were listed', () => {
    const out = bloomRow('abcdef', [
      { row: 0, col: 4, glyph: '❀' },
      { row: 0, col: 1, glyph: '✿' },
    ])
    expect(text(out)).toBe('a✿cd❀f')
  })

  it('handles a bloom at either end', () => {
    expect(text(bloomRow('abc', [{ row: 0, col: 0, glyph: '✿' }]))).toBe('✿bc')
    expect(text(bloomRow('abc', [{ row: 0, col: 2, glyph: '✿' }]))).toBe('ab✿')
  })

  // The scramble shortens nothing, but a reworded banner could, and a bloom past
  // the end would otherwise append a stray glyph.
  it('ignores a bloom outside the row', () => {
    expect(bloomRow('ab', [{ row: 0, col: 9, glyph: '✿' }])).toEqual([{ text: 'ab' }])
  })
})

describe('bloomsIn', () => {
  it('picks out one row', () => {
    const all = [
      { row: 1, col: 7, glyph: '✿' },
      { row: 2, col: 3, glyph: '❀' },
      { row: 1, col: 11, glyph: '✽' },
    ]
    expect(bloomsIn(all, 1)).toHaveLength(2)
    expect(bloomsIn(all, 5)).toEqual([])
  })
})
