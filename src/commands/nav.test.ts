import { describe, expect, it } from 'vitest'
import { cd, ls, pwd } from './nav'
import type { ShellContext } from './types'
import { root } from '../fs/tree'

const ctx = (cwd: string): ShellContext => ({ root, cwd, history: [] })

describe('pwd', () => {
  it('prints the current directory with ~ for home', () => {
    expect(pwd([], ctx('/')).lines[0]).toMatchObject({ type: 'text', text: '~' })
    expect(pwd([], ctx('/projects')).lines[0]).toMatchObject({ text: '~/projects' })
  })
})

describe('ls', () => {
  it('lists the current directory as path entries', () => {
    const [line] = ls([], ctx('/')).lines
    if (line.type !== 'paths') throw new Error('expected paths')
    const names = line.entries.map((entry) => entry.name)
    expect(names).toContain('about.txt')
    expect(names).toContain('projects')
  })

  it('sorts directories before files', () => {
    const [line] = ls([], ctx('/')).lines
    if (line.type !== 'paths') throw new Error('expected paths')
    const firstFile = line.entries.findIndex((entry) => entry.kind === 'file')
    const lastDir = line.entries.map((entry) => entry.kind).lastIndexOf('dir')
    expect(lastDir).toBeLessThan(firstFile)
  })

  it('gives entries absolute paths', () => {
    const [line] = ls(['projects'], ctx('/')).lines
    if (line.type !== 'paths') throw new Error('expected paths')
    expect(line.entries[0].path).toMatch(/^\/projects\//)
  })

  it('lists a named directory', () => {
    const [line] = ls(['projects'], ctx('/')).lines
    if (line.type !== 'paths') throw new Error('expected paths')
    expect(line.entries.map((entry) => entry.name)).toContain('mfbo-framework')
  })

  it('prints just the name when given a file', () => {
    expect(ls(['about.txt'], ctx('/')).lines[0]).toMatchObject({
      type: 'text',
      text: 'about.txt',
    })
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
    expect(cd(['projects'], ctx('/')).cwd).toBe('/projects')
  })

  it('goes home with no argument', () => {
    expect(cd([], ctx('/projects/mfbo-framework')).cwd).toBe('/')
  })

  it('goes up with ..', () => {
    expect(cd(['..'], ctx('/projects')).cwd).toBe('/')
  })

  it('refuses to cd into a file', () => {
    const result = cd(['about.txt'], ctx('/'))
    expect(result.cwd).toBeUndefined()
    expect(result.lines[0]).toMatchObject({
      tone: 'error',
      text: 'cd: about.txt: Not a directory',
    })
  })

  it('errors on a missing directory', () => {
    const result = cd(['nope'], ctx('/'))
    expect(result.cwd).toBeUndefined()
    expect(result.lines[0]).toMatchObject({ tone: 'error' })
  })
})
