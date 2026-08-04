import { describe, expect, it } from 'vitest'
import { SUGGESTIONS, ghostFrames } from './ghost'
import { COMMANDS } from '../commands/index'

describe('SUGGESTIONS', () => {
  // The suggestion is one keypress from running, so a non-command would greet a
  // visitor with `command not found`.
  it('only contains runnable commands', () => {
    const names = COMMANDS.map((command) => command.name)
    for (const suggestion of SUGGESTIONS) {
      const [name] = suggestion.split(' ')
      expect(names, suggestion).toContain(name)
    }
  })

  it('is not empty', () => {
    expect(SUGGESTIONS.length).toBeGreaterThan(0)
  })
})

describe('ghostFrames', () => {
  it('types a suggestion one character at a time', () => {
    expect(ghostFrames(['abc'], 0, 0).map((frame) => frame.shown)).toEqual(['a', 'ab', 'abc'])
  })

  it('holds the completed suggestion', () => {
    expect(ghostFrames(['ab'], 3, 0).map((frame) => frame.shown)).toEqual([
      'a',
      'ab',
      'ab',
      'ab',
      'ab',
    ])
  })

  it('blanks between suggestions', () => {
    expect(ghostFrames(['a', 'b'], 0, 2).map((frame) => frame.shown)).toEqual([
      'a',
      '',
      '',
      'b',
      '',
      '',
    ])
  })

  // The bug this guards: accepting mid-animation ran `cat contact` rather than
  // `cat contact.txt`, so the visitor got No such file or directory.
  it('carries the complete command on every visible frame', () => {
    for (const frame of ghostFrames(SUGGESTIONS)) {
      if (frame.shown === '') continue
      expect(SUGGESTIONS, frame.shown).toContain(frame.full)
      expect(frame.full.startsWith(frame.shown), frame.shown).toBe(true)
    }
  })

  it('carries no command on blank frames, so accept cannot fire', () => {
    for (const frame of ghostFrames(SUGGESTIONS)) {
      if (frame.shown === '') expect(frame.full).toBe('')
    }
  })

  it('covers every suggestion', () => {
    const shown = ghostFrames(SUGGESTIONS).map((frame) => frame.shown)
    for (const suggestion of SUGGESTIONS) {
      expect(shown, suggestion).toContain(suggestion)
    }
  })

  it('returns nothing for no suggestions', () => {
    expect(ghostFrames([])).toEqual([])
  })
})
