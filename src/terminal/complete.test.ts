import { describe, expect, it } from 'vitest'
import { complete } from './complete'
import { fixtureRoot as root } from '../fs/fixture'

describe('complete', () => {
  it('completes a command name at the start of the line', () => {
    expect(complete('wh', root, '/')).toBe('whoami ')
  })

  it('leaves an ambiguous command prefix alone', () => {
    // 'c' matches cd, cat and clear.
    expect(complete('c', root, '/')).toBe('c')
    // 'h' matches help and history.
    expect(complete('h', root, '/')).toBe('h')
  })

  it('completes a path argument', () => {
    expect(complete('cat rea', root, '/')).toBe('cat readme ')
  })

  it('appends a slash for directories', () => {
    expect(complete('cd al', root, '/')).toBe('cd alpha/')
  })

  it('completes inside a nested path', () => {
    expect(complete('cat alpha/be', root, '/')).toBe('cat alpha/beta/')
  })

  it('respects the cwd', () => {
    expect(complete('cat app', root, '/alpha')).toBe('cat apple ')
  })

  it('leaves an ambiguous path prefix alone', () => {
    // An empty fragment matches every child, so there is nothing unique to pick.
    expect(complete('cat ', root, '/')).toBe('cat ')
  })

  it('returns the input unchanged when nothing matches', () => {
    expect(complete('cat zzz', root, '/')).toBe('cat zzz')
  })

  it('returns the input unchanged when the directory does not exist', () => {
    expect(complete('cat nope/th', root, '/')).toBe('cat nope/th')
  })
})
