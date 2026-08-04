import { describe, expect, it } from 'vitest'
import { nextLines } from './scrollback'
import type { Line } from '../commands/types'
import { text } from '../commands/types'

const boot: Line[] = [text('BANNER'), text('who I am')]
const previous: Line[] = [text('older output')]

describe('nextLines', () => {
  it('appends output to what is already there', () => {
    const out = nextLines(previous, { lines: [text('new')] }, boot)
    expect(out.map((line) => ('text' in line ? line.text : ''))).toEqual(['older output', 'new'])
  })

  it('leaves the scrollback alone for a command with no output', () => {
    expect(nextLines(previous, { lines: [] }, boot)).toEqual(previous)
  })

  // The header is the identity and the navigation, so `clear` must not eat it.
  it('resets to the boot header on clear', () => {
    expect(nextLines(previous, { lines: [], clear: true }, boot)).toEqual(boot)
  })

  it('discards prior output and the echoed command on clear', () => {
    const out = nextLines(previous, { lines: [text('echoed prompt')], clear: true }, boot)
    expect(out).toEqual(boot)
    expect(out.map((line) => ('text' in line ? line.text : ''))).not.toContain('older output')
  })
})
