import { describe, expect, it } from 'vitest'
import { cat, open, tree } from './content'
import type { ShellContext } from './types'
import { fixtureRoot } from '../fs/fixture'

const ctx = (cwd: string): ShellContext => ({ root: fixtureRoot, cwd, history: [] })

describe('cat', () => {
  it('prints a file body one line per line', () => {
    const result = cat(['readme'], ctx('/'))
    expect(result.lines.length).toBeGreaterThan(1)
    expect(result.lines[0]).toMatchObject({ type: 'text', text: 'line one' })
  })

  it('requires an argument', () => {
    expect(cat([], ctx('/')).lines[0]).toMatchObject({
      tone: 'error',
      text: 'usage: cat <file>',
    })
  })

  it('refuses a directory', () => {
    expect(cat(['alpha'], ctx('/')).lines[0]).toMatchObject({
      tone: 'error',
      text: 'cat: alpha: Is a directory',
    })
  })

  it('errors on a missing file', () => {
    expect(cat(['nope'], ctx('/')).lines[0]).toMatchObject({ tone: 'error' })
  })

  it('reads a file by stem, without its extension', () => {
    expect(cat(['notes'], ctx('/')).lines[0]).toMatchObject({ text: 'notes' })
  })

  // A shell resolves against the working directory, so typing a name that lives
  // somewhere else must not read it. It says where to look instead.
  it('refuses a name from the wrong directory and points at the real path', () => {
    const result = cat(['apple'], ctx('/'))
    expect(result.lines[0]).toMatchObject({ tone: 'error' })
    expect(result.lines[1]).toMatchObject({ type: 'hint', verb: 'try', command: 'cat ~/alpha/apple' })
  })

  it('offers no correction for a name that is nowhere at all', () => {
    expect(cat(['nope'], ctx('/')).lines).toHaveLength(1)
  })

  // The text reads as it would from the file's own directory; the click carries
  // the path, so clicking works from anywhere in the tree.
  it('points a hint click at the full path of what it names', () => {
    const hint = cat(['alpha/hinted'], ctx('/')).lines.find((line) => line.type === 'hint')
    expect(hint).toMatchObject({ command: 'cat apple', run: 'cat ~/alpha/apple' })
  })

  it('binds the same path whether the file was reached by path or from inside', () => {
    const [line] = cat(['hinted'], ctx('/alpha')).lines.filter((l) => l.type === 'hint')
    expect(line).toMatchObject({ run: 'cat ~/alpha/apple' })
  })
})

describe('tree', () => {
  it('renders nested structure as clickable path lines', () => {
    const rendered = tree([], ctx('/')).lines
    expect(rendered.filter((line) => line.type === 'paths').length).toBeGreaterThan(3)
  })

  const guides = (target: string) =>
    tree([target], ctx('/')).lines.flatMap((line) =>
      line.type === 'paths' ? [line.entries[0].name] : [],
    )

  it('indents children below their directory', () => {
    const names = guides('.')

    // Top-level entries carry no indent.
    expect(names.some((name) => /^[\u251c\u2514]\u2500\u2500 /.test(name))).toBe(true)
    // A child of an entry with siblings after it gets a vertical guide column.
    expect(names.some((name) => /^\u2502 {3}[\u251c\u2514]\u2500\u2500 /.test(name))).toBe(true)
  })

  it('drops the guide column under the last entry', () => {
    // Only reachable inside a directory whose last child is itself a directory,
    // since at root the last entry is always a file.
    const names = guides('zulu')
    expect(names.some((name) => /^ {4}[\u251c\u2514]\u2500\u2500 /.test(name))).toBe(true)
  })

  it('errors on a missing path', () => {
    expect(tree(['nope'], ctx('/')).lines[0]).toMatchObject({ tone: 'error' })
  })
})

describe('open', () => {
  it('returns the href of a linked file', () => {
    expect(open(['linked'], ctx('/')).openUrl).toBe('https://example.com/linked')
  })

  it('says so when a file has no link, rather than opening nothing', () => {
    const result = open(['nolink'], ctx('/'))
    expect(result.openUrl).toBeUndefined()
    const [line] = result.lines
    expect(line).toMatchObject({ tone: 'error' })
    expect(line.type === 'text' && line.text).toContain('no link')
  })

  it('refuses a directory', () => {
    expect(open(['alpha'], ctx('/')).lines[0]).toMatchObject({ tone: 'error' })
  })

  it('requires an argument', () => {
    expect(open([], ctx('/')).lines[0]).toMatchObject({ text: 'usage: open <file>' })
  })

  // Typing it in the wrong place opens nothing: the visitor is learning a shell.
  it('opens nothing from the wrong directory, and says where the file is', () => {
    const result = open(['linked'], ctx('/alpha/beta'))
    expect(result.openUrl).toBeUndefined()
    expect(result.lines[1]).toMatchObject({ verb: 'try', command: 'open ~/linked' })
  })
})
