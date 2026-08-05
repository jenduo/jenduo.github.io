import { describe, expect, it } from 'vitest'
import { SUGGESTIONS, ghostFrames, suggestionsFor } from './ghost'
import { COMMANDS } from '../commands/index'
import { isTheme } from '../commands/themes'
import { fixtureRoot } from '../fs/fixture'
import { resolve } from '../fs/resolve'
import type { Dir } from '../fs/types'

const dirAt = (cwd: string): Dir => {
  const node = resolve(fixtureRoot, cwd, '.')
  if (!node || node.kind !== 'dir') throw new Error(`no directory at ${cwd}`)
  return node
}

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

  // `colour teal` would type out perfectly and then fail on the keypress.
  it('names a real theme wherever it suggests a colour', () => {
    const colours = SUGGESTIONS.filter((suggestion) => suggestion.startsWith('colour '))
    expect(colours.length).toBeGreaterThan(0)
    for (const suggestion of colours) {
      expect(isTheme(suggestion.slice('colour '.length)), suggestion).toBe(true)
    }
  })
})

describe('suggestionsFor', () => {
  const names = COMMANDS.map((command) => command.name)

  it('keeps the curated tour at the root rather than listing the home directory', () => {
    expect(suggestionsFor(dirAt('/'), '/')).toEqual(SUGGESTIONS)
  })

  it('names real contents inside a directory', () => {
    const suggestions = suggestionsFor(dirAt('/alpha'), '/alpha')
    expect(suggestions).toContain('cat apple')
    expect(suggestions).toContain('cd beta')
  })

  // Same rule as the root list: one keypress runs it, so it must be runnable.
  it('only ever suggests real commands', () => {
    for (const cwd of ['/', '/alpha', '/alpha/beta', '/mid', '/zulu']) {
      for (const suggestion of suggestionsFor(dirAt(cwd), cwd)) {
        expect(names, `${cwd}: ${suggestion}`).toContain(suggestion.split(' ')[0])
      }
    }
  })

  it('offers a way out of a directory', () => {
    expect(suggestionsFor(dirAt('/alpha'), '/alpha')).toContain('cd ..')
  })

  it('offers only the way out of an empty directory', () => {
    expect(suggestionsFor(dirAt('/mid'), '/mid')).toEqual(['cd ..'])
  })

  it('caps how many it offers, so a big directory does not drone on', () => {
    const many: Dir = {
      kind: 'dir',
      name: 'many',
      children: Array.from({ length: 12 }, (_, i) => ({
        kind: 'file' as const,
        name: `f${i}`,
        body: '',
      })),
    }
    expect(suggestionsFor(many, '/many').length).toBeLessThanOrEqual(4)
  })

  it('falls back to the curated list when the directory cannot be resolved', () => {
    expect(suggestionsFor(null, '/somewhere')).toEqual(SUGGESTIONS)
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
