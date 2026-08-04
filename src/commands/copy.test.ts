import { describe, expect, it } from 'vitest'
import { copy } from './copy'
import type { ShellContext } from './types'
import { fixtureRoot } from '../fs/fixture'
import type { Dir } from '../fs/types'

const ctx = (root: Dir = fixtureRoot, cwd = '/'): ShellContext => ({ root, cwd, history: [] })
const asText = (lines: { type: string }[]) =>
  lines.map((line) => ('text' in line ? String(line.text) : '')).join('\n')

describe('copy', () => {
  it('returns the file body to copy', () => {
    const result = copy(['readme'], ctx())
    expect(result.copy).toBe('line one\nline two')
  })

  it('confirms what it copied when it fits on a line', () => {
    const result = copy(['nolink'], ctx())
    expect(result.copy).toBe('nothing to open')
    expect(asText(result.lines)).toBe('copied: nothing to open')
  })

  // Echoing a whole README back would flood the screen.
  it('reports a length instead of echoing multi-line content', () => {
    expect(asText(copy(['readme'], ctx()).lines)).toMatch(/^copied \d+ characters/)
  })

  it('reports a length instead of echoing a very long single line', () => {
    const root: Dir = {
      kind: 'dir',
      name: '',
      children: [{ kind: 'file', name: 'long', body: 'x'.repeat(200) }],
    }
    const result = copy(['long'], ctx(root))
    expect(result.copy).toHaveLength(200)
    expect(asText(result.lines)).toMatch(/^copied 200 characters/)
  })

  // The point of copyText: `copy email` should give the address alone.
  it('prefers copyText over the body', () => {
    const root: Dir = {
      kind: 'dir',
      name: '',
      children: [
        {
          kind: 'file',
          name: 'email',
          body: 'someone@example.com\n\n  type open email to write to me.\n',
          copyText: 'someone@example.com',
        },
      ],
    }
    expect(copy(['email'], ctx(root)).copy).toBe('someone@example.com')
  })

  it('requires an argument', () => {
    const result = copy([], ctx())
    expect(result.copy).toBeUndefined()
    expect(result.lines[0]).toMatchObject({ tone: 'error', text: 'usage: copy <file>' })
  })

  it('refuses a directory', () => {
    const result = copy(['alpha'], ctx())
    expect(result.copy).toBeUndefined()
    expect(asText(result.lines)).toContain('Is a directory')
  })

  it('errors on a missing file', () => {
    expect(copy(['nope'], ctx()).copy).toBeUndefined()
    expect(asText(copy(['nope'], ctx()).lines)).toContain('No such file or directory')
  })

  it('copies nothing rather than whitespace for an empty file', () => {
    const root: Dir = {
      kind: 'dir',
      name: '',
      children: [{ kind: 'file', name: 'blank', body: '   \n\n' }],
    }
    const result = copy(['blank'], ctx(root))
    expect(result.copy).toBeUndefined()
    expect(asText(result.lines)).toContain('nothing to copy')
  })

  it('works on a file named without its extension', () => {
    expect(copy(['notes'], ctx()).copy).toBe('notes')
  })
})
