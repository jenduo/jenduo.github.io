import { describe, expect, it } from 'vitest'
import { BOOT } from './boot'
import { ls } from '../commands/nav'
import { root } from '../fs/tree'

const bootEntries = () => {
  const line = BOOT.find((entry) => entry.type === 'paths')
  if (!line || line.type !== 'paths') throw new Error('the boot screen lists no paths')
  return line.entries
}

describe('BOOT', () => {
  // This is the regression: the landing list was hand-written, so it drifted
  // from the filesystem and hid `education` and `resume.pdf` from anyone who
  // never thought to run `ls`.
  it('offers every top-level entry, in the same order as ls', () => {
    const [listing] = ls([], { root, cwd: '/', history: [] }).lines
    if (listing.type !== 'paths') throw new Error('expected paths from ls')

    expect(bootEntries().map((entry) => entry.name)).toEqual(
      listing.entries.map((entry) => entry.name),
    )
  })

  it('gives every entry an absolute path and the right kind', () => {
    for (const entry of bootEntries()) {
      expect(entry.path, entry.name).toBe(`/${entry.name}`)
      expect(['dir', 'file'], entry.name).toContain(entry.kind)
    }
  })

  it('shows the banner and the greeting', () => {
    expect(BOOT.some((line) => line.type === 'banner')).toBe(true)
    expect(BOOT.some((line) => line.type === 'text' && line.variant === 'hero')).toBe(true)
  })
})
