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

  // The card has its own margin, so an authored blank underneath doubled the gap.
  it('swallows a single blank line after a card, keeping the source readable', () => {
    const lines = formatBody('# Title\n## Sub\n\nbody')
    expect(lines).toHaveLength(2)
    expect(textAt('# Title\n## Sub\n\nbody', 1).text).toBe('body')
  })

  it('swallows the blank after a card with no subtitle too', () => {
    expect(textAt('# Title\n\nbody', 1).text).toBe('body')
  })

  // Only one: a deliberate double blank still opens a gap.
  it('keeps a second blank line after a card', () => {
    expect(textAt('# Title\n\n\nbody', 1).text).toBe('')
  })

  // The command is clickable, so it travels as data rather than inside a string.
  describe('hints', () => {
    const hintAt = (body: string, index = 0) => {
      const line = formatBody(body)[index]
      if (line.type !== 'hint') throw new Error(`line ${index} is not a hint`)
      return line
    }

    it('splits the command out of the sentence', () => {
      const hint = hintAt("type 'open github' to see my repos.")
      expect(hint.command).toBe('open github')
      expect(hint.after).toBe(' to see my repos.')
    })

    it('indents like the prose it sits among', () => {
      expect(hintAt("type 'open github' to see my repos.").variant).toBe('body')
    })

    // Otherwise the boot screen's hint would run 'help,' with the comma.
    it('stops the command at the closing quote', () => {
      expect(hintAt("type 'help', or click anything above.").command).toBe('help')
    })

    it('leaves prose that merely quotes something alone', () => {
      expect(textAt("she said 'hello' to me").variant).toBe('body')
      expect(textAt('type this out by hand').variant).toBe('body')
    })
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
