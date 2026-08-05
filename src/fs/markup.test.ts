import { describe, expect, it } from 'vitest'
import { formatBody } from './markup'

/** Narrows to a text line, which is all formatBody ever produces. */
const at = (body: string, index = 0) => {
  const line = formatBody(body)[index]
  if (line.type !== 'text') throw new Error(`line ${index} is not text`)
  return line
}

describe('formatBody', () => {
  it('turns a # line into a heading and drops the hash', () => {
    expect(at('# InvestorHub')).toMatchObject({ text: 'InvestorHub', variant: 'heading' })
  })

  it('leaves ordinary lines alone', () => {
    const line = at('Melbourne CBD, VIC')
    expect(line.text).toBe('Melbourne CBD, VIC')
    expect(line.variant).toBeUndefined()
  })

  it('keeps one line of output per line of input', () => {
    expect(formatBody('# One\ntwo\n\nfour')).toHaveLength(4)
  })

  it('preserves blank lines, which carry the spacing', () => {
    expect(at('a\n\nb', 1).text).toBe('')
  })

  // A hash inside prose is not a heading, and neither is one with no space.
  it('only treats a leading hash followed by a space as a heading', () => {
    expect(at('#nospace').variant).toBeUndefined()
    expect(at('a # b').variant).toBeUndefined()
  })

  it('keeps leading spaces, which the bodies rely on for indentation', () => {
    expect(at('  indented').text).toBe('  indented')
  })

  it('only marks the heading, not the lines after it', () => {
    expect(at('# Title\nbody', 1).variant).toBeUndefined()
  })
})
