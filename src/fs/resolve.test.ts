import { describe, expect, it } from 'vitest'
import { displayPath, normalize, resolve, stem } from './resolve'
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

describe('stem', () => {
  it('strips a single extension', () => {
    expect(stem('resume.pdf')).toBe('resume')
    expect(stem('about.txt')).toBe('about')
  })

  it('strips only the last extension', () => {
    expect(stem('archive.tar.gz')).toBe('archive.tar')
  })

  it('leaves an extensionless name alone', () => {
    expect(stem('investorhub')).toBe('investorhub')
  })

  // A leading dot is the name, not an extension.
  it('keeps dotfiles whole', () => {
    expect(stem('.bashrc')).toBe('.bashrc')
  })
})

describe('resolve without an extension', () => {
  it('finds a file by its stem', () => {
    expect(resolve(root, '/', 'about')).toMatchObject({ name: 'about.txt' })
  })

  it('finds a nested file by its stem', () => {
    expect(resolve(root, '/projects/alpha', 'README')).toMatchObject({ name: 'README.md' })
  })

  it('still prefers an exact match', () => {
    const dir: Dir = {
      kind: 'dir',
      name: '',
      children: [
        { kind: 'file', name: 'notes', body: 'exact' },
        { kind: 'file', name: 'notes.txt', body: 'stem' },
      ],
    }
    expect(resolve(dir, '/', 'notes')).toMatchObject({ body: 'exact' })
  })

  // Guessing between two candidates would be worse than saying no.
  it('refuses an ambiguous stem', () => {
    const dir: Dir = {
      kind: 'dir',
      name: '',
      children: [
        { kind: 'file', name: 'notes.txt', body: 'a' },
        { kind: 'file', name: 'notes.md', body: 'b' },
      ],
    }
    expect(resolve(dir, '/', 'notes')).toBeNull()
  })

  it('still returns null for a name that matches nothing', () => {
    expect(resolve(root, '/', 'nope')).toBeNull()
  })
})

describe('displayPath', () => {
  it('renders home as ~', () => {
    expect(displayPath('/')).toBe('~')
    expect(displayPath('/projects/alpha')).toBe('~/projects/alpha')
  })
})
