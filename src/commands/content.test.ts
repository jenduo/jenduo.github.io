import { describe, expect, it } from 'vitest'
import { cat, open, tree } from './content'
import type { ShellContext } from './types'
import { root } from '../fs/tree'

const ctx = (cwd: string): ShellContext => ({ root, cwd, history: [] })

describe('cat', () => {
  it('prints a file body one line per line', () => {
    const result = cat(['about.txt'], ctx('/'))
    expect(result.lines.length).toBeGreaterThan(1)
    expect(result.lines[0]).toMatchObject({ type: 'text' })
  })

  it('requires an argument', () => {
    expect(cat([], ctx('/')).lines[0]).toMatchObject({
      tone: 'error',
      text: 'usage: cat <file>',
    })
  })

  it('refuses a directory', () => {
    expect(cat(['projects'], ctx('/')).lines[0]).toMatchObject({
      tone: 'error',
      text: 'cat: projects: Is a directory',
    })
  })

  it('errors on a missing file', () => {
    expect(cat(['nope'], ctx('/')).lines[0]).toMatchObject({ tone: 'error' })
  })
})

describe('tree', () => {
  it('renders nested structure as clickable path lines', () => {
    const rendered = tree([], ctx('/')).lines
    expect(rendered.filter((line) => line.type === 'paths').length).toBeGreaterThan(3)
  })

  it('indents children below their directory', () => {
    const rendered = tree([], ctx('/')).lines
    const indented = rendered.filter(
      (line) => line.type === 'paths' && line.entries[0].name.includes('    '),
    )
    expect(indented.length).toBeGreaterThan(0)
  })

  it('errors on a missing path', () => {
    expect(tree(['nope'], ctx('/')).lines[0]).toMatchObject({ tone: 'error' })
  })
})

describe('open', () => {
  it('returns the href of a linked file', () => {
    expect(open(['projects/mfbo-framework/README.md'], ctx('/')).openUrl).toBe(
      'https://github.com/jenduo/mfbo-framework',
    )
  })

  it('explains when a file has no link', () => {
    const result = open(['resume.pdf'], ctx('/'))
    expect(result.openUrl).toBeUndefined()
    const [line] = result.lines
    expect(line).toMatchObject({ tone: 'error' })
    expect(line.type === 'text' && line.text).toContain('not uploaded')
  })

  it('refuses a directory', () => {
    expect(open(['projects'], ctx('/')).lines[0]).toMatchObject({ tone: 'error' })
  })

  it('requires an argument', () => {
    expect(open([], ctx('/')).lines[0]).toMatchObject({ text: 'usage: open <file>' })
  })
})
