import { describe, expect, it } from 'vitest'
import { commandFor, hashFor, pathFromHash } from './route'

describe('hashFor', () => {
  it('gives home no hash, rather than a bare #', () => {
    expect(hashFor('/')).toBe('')
  })

  it('carries a path', () => {
    expect(hashFor('/experience')).toBe('#/experience')
    expect(hashFor('/experience/investorhub')).toBe('#/experience/investorhub')
  })
})

describe('pathFromHash', () => {
  it('reads a path back', () => {
    expect(pathFromHash('#/experience/investorhub')).toBe('/experience/investorhub')
  })

  it('treats no hash as home', () => {
    expect(pathFromHash('')).toBeNull()
    expect(pathFromHash('#')).toBeNull()
  })

  it('reads #/ as home', () => {
    expect(pathFromHash('#/')).toBe('/')
  })

  // Someone else's anchor, or a stray link. Not a path, so not guessed at.
  it('ignores a hash that is not a rooted path', () => {
    expect(pathFromHash('#top')).toBeNull()
    expect(pathFromHash('#experience')).toBeNull()
  })

  it('survives a trailing slash', () => {
    expect(pathFromHash('#/experience/')).toBe('/experience')
  })

  // The round trip has to hold or the URL would fight the shell every render.
  it('round-trips with hashFor', () => {
    for (const path of ['/', '/experience', '/experience/investorhub', '/resume.pdf']) {
      expect(pathFromHash(hashFor(path)) ?? '/').toBe(path)
    }
  })
})

describe('commandFor', () => {
  it('walks into a directory and reads a file', () => {
    expect(commandFor('/experience', 'dir')).toBe('cd /experience')
    expect(commandFor('/experience/investorhub', 'file')).toBe('cat /experience/investorhub')
  })
})
