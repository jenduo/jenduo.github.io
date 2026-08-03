import { describe, expect, it } from 'vitest'
import { displayPath, normalize, resolve } from './resolve'
import type { Dir } from './types'

const root: Dir = {
  kind: 'dir',
  name: '',
  children: [
    { kind: 'file', name: 'about.txt', body: 'hi' },
    {
      kind: 'dir',
      name: 'projects',
      children: [
        {
          kind: 'dir',
          name: 'alpha',
          children: [{ kind: 'file', name: 'README.md', body: 'a' }],
        },
      ],
    },
  ],
}

describe('normalize', () => {
  it('resolves a relative segment against cwd', () => {
    expect(normalize('/', 'projects')).toBe('/projects')
    expect(normalize('/projects', 'alpha')).toBe('/projects/alpha')
  })

  it('treats leading / and ~ as absolute', () => {
    expect(normalize('/projects/alpha', '/about.txt')).toBe('/about.txt')
    expect(normalize('/projects/alpha', '~')).toBe('/')
    expect(normalize('/projects/alpha', '~/projects')).toBe('/projects')
  })

  it('collapses . and ..', () => {
    expect(normalize('/projects/alpha', '..')).toBe('/projects')
    expect(normalize('/projects/alpha', '../..')).toBe('/')
    expect(normalize('/projects', './alpha/.')).toBe('/projects/alpha')
  })

  it('cannot escape the root', () => {
    expect(normalize('/', '..')).toBe('/')
    expect(normalize('/', '../../../etc')).toBe('/etc')
  })

  it('ignores empty and repeated separators', () => {
    expect(normalize('/', 'projects//alpha/')).toBe('/projects/alpha')
    expect(normalize('/projects', '')).toBe('/projects')
  })
})

describe('resolve', () => {
  it('finds a directory', () => {
    expect(resolve(root, '/', 'projects')).toMatchObject({ kind: 'dir', name: 'projects' })
  })

  it('finds a nested file', () => {
    expect(resolve(root, '/projects/alpha', 'README.md')).toMatchObject({ name: 'README.md' })
  })

  it('resolves the root itself', () => {
    expect(resolve(root, '/', '.')).toBe(root)
    expect(resolve(root, '/projects', '~')).toBe(root)
  })

  it('returns null for a missing node', () => {
    expect(resolve(root, '/', 'nope')).toBeNull()
  })

  it('returns null when descending through a file', () => {
    expect(resolve(root, '/', 'about.txt/deeper')).toBeNull()
  })
})

describe('displayPath', () => {
  it('renders home as ~', () => {
    expect(displayPath('/')).toBe('~')
    expect(displayPath('/projects/alpha')).toBe('~/projects/alpha')
  })
})
