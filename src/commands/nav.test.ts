import { describe, expect, it } from 'vitest'
import { cd, ls, pwd } from './nav'
import type { ShellContext } from './types'
import { fixtureRoot } from '../fs/fixture'

const ctx = (cwd: string): ShellContext => ({ root: fixtureRoot, cwd, history: [] })

describe('pwd', () => {
  it('prints the current directory with ~ for home', () => {
    expect(pwd([], ctx('/')).lines[0]).toMatchObject({ type: 'text', text: '~' })
    expect(pwd([], ctx('/alpha')).lines[0]).toMatchObject({ text: '~/alpha' })
  })
})

describe('ls', () => {
  it('lists the current directory as path entries', () => {
    const [line] = ls([], ctx('/')).lines
    if (line.type !== 'paths') throw new Error('expected paths')
    const names = line.entries.map((entry) => entry.name)
    expect(names).toContain('readme')
    expect(names).toContain('alpha')
  })

  it('sorts directories before files', () => {
    const [line] = ls([], ctx('/')).lines
    if (line.type !== 'paths') throw new Error('expected paths')
    const firstFile = line.entries.findIndex((entry) => entry.kind === 'file')
    const lastDir = line.entries.map((entry) => entry.kind).lastIndexOf('dir')
    expect(lastDir).toBeLessThan(firstFile)
  })

  it('gives entries absolute paths', () => {
    const [line] = ls(['alpha'], ctx('/')).lines
    if (line.type !== 'paths') throw new Error('expected paths')
    expect(line.entries[0].path).toMatch(/^\/alpha\//)
  })

  it('lists a named directory', () => {
    const [line] = ls(['alpha'], ctx('/')).lines
    if (line.type !== 'paths') throw new Error('expected paths')
    expect(line.entries.map((entry) => entry.name)).toContain('beta')
  })

  it('prints just the name when given a file', () => {
    expect(ls(['readme'], ctx('/')).lines[0]).toMatchObject({ type: 'text', text: 'readme' })
  })

  it('lists an empty directory without error', () => {
    const [line] = ls(['mid'], ctx('/')).lines
    if (line.type !== 'paths') throw new Error('expected paths')
    expect(line.entries).toEqual([])
  })

  it('errors on a missing path', () => {
    expect(ls(['nope'], ctx('/')).lines[0]).toMatchObject({
      tone: 'error',
      text: 'ls: nope: No such file or directory',
    })
  })
})

describe('cd', () => {
  it('enters a directory and returns the new cwd', () => {
    expect(cd(['alpha'], ctx('/')).cwd).toBe('/alpha')
  })

  it('goes home with no argument', () => {
    expect(cd([], ctx('/alpha/beta')).cwd).toBe('/')
  })

  it('goes up with ..', () => {
    expect(cd(['..'], ctx('/alpha')).cwd).toBe('/')
  })

  it('refuses to cd into a file', () => {
    const result = cd(['readme'], ctx('/'))
    expect(result.cwd).toBeUndefined()
    expect(result.lines[0]).toMatchObject({
      tone: 'error',
      text: 'cd: readme: Not a directory',
    })
  })

  it('errors on a missing directory', () => {
    const result = cd(['nope'], ctx('/'))
    expect(result.cwd).toBeUndefined()
    expect(result.lines[0]).toMatchObject({ tone: 'error' })
  })

})
