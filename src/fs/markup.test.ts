import { describe, expect, it } from 'vitest'
import { formatBody } from './markup'

/** Narrows to a text line. */
const textAt = (body: string, index = 0) => {
  const line = formatBody(body)[index]
  if (line.type !== 'text') throw new Error(`line ${index} is not text`)
  return line
}

/** Narrows to a title card. */
const cardAt = (body: string, index = 0) => {
  const line = formatBody(body)[index]
  if (line.type !== 'titlecard') throw new Error(`line ${index} is not a titlecard`)
  return line
}

describe('formatBody', () => {
  it('turns a # line into a title card and drops the hash', () => {
    expect(cardAt('# InvestorHub')).toMatchObject({ title: 'InvestorHub', subtitle: undefined })
  })

  it('attaches a following ## line as the subtitle', () => {
    const card = cardAt('# InvestorHub · Software Engineer\n## Melbourne CBD, VIC')
    expect(card.title).toBe('InvestorHub · Software Engineer')
    expect(card.subtitle).toBe('Melbourne CBD, VIC')
  })

  // Both lines collapse into one card, so the body that follows must not shift.
  it('consumes the subtitle line rather than emitting it twice', () => {
    const lines = formatBody('# Title\n## Sub\nbody')
    expect(lines).toHaveLength(2)
    expect(textAt('# Title\n## Sub\nbody', 1).text).toBe('body')
  })

  it('marks ordinary lines as body prose, keeping the text intact', () => {
    const line = textAt('Melbourne CBD, VIC')
    expect(line.text).toBe('Melbourne CBD, VIC')
    expect(line.variant).toBe('body')
  })

  // The marker is added by CSS so a wrapped bullet can hang under its own text.
  it('marks a bullet and strips its dash', () => {
    const line = textAt('- Built a thing')
    expect(line.text).toBe('Built a thing')
    expect(line.variant).toBe('bullet')
  })

  it('does not treat a dash inside prose as a bullet', () => {
    expect(textAt('full-stack work').variant).toBe('body')
  })

  it('preserves blank lines, which carry the spacing', () => {
    expect(textAt('a\n\nb', 1).text).toBe('')
  })

  // A hash inside prose is not a title, and neither is one with no space.
  it('only treats a leading hash followed by a space as a title', () => {
    expect(textAt('#nospace').text).toBe('#nospace')
    expect(textAt('a # b').text).toBe('a # b')
  })

  // Otherwise a stray ## would produce a card with no title at all.
  it('leaves a ## with no title above it as plain text', () => {
    expect(textAt('## orphan').text).toBe('## orphan')
  })

  it('does not attach a ## that is separated by a blank line', () => {
    const card = cardAt('# Title\n\n## Later')
    expect(card.subtitle).toBeUndefined()
  })

  // Bodies are authored unindented now; extra spaces are still passed through
  // for the rare line that wants them.
  it('passes leading spaces through untouched', () => {
    expect(textAt('  indented').text).toBe('  indented')
  })
})
