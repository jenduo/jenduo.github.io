import { describe, expect, it } from 'vitest'
import { BOOT } from './boot'
import { entriesOf, ls } from '../commands/nav'
import { resolve } from '../fs/resolve'
import { root } from '../fs/tree'
import type { Dir } from '../fs/types'

const dirAt = (cwd: string): Dir => {
  const node = resolve(root, cwd, '.')
  if (!node || node.kind !== 'dir') throw new Error(`no directory at ${cwd}`)
  return node
}

const listing = (path: string) => {
  const [line] = ls([path], { root, cwd: '/', history: [] }).lines
  if (line.type !== 'paths') throw new Error(`expected paths for ${path}`)
  return line.entries
}

describe('BOOT', () => {
  it('shows the banner and the greeting', () => {
    expect(BOOT.some((line) => line.type === 'banner')).toBe(true)
    expect(BOOT.some((line) => line.type === 'text' && line.variant === 'hero')).toBe(true)
  })

  // The entry list used to be printed here and never changed, so it showed the
  // root forever and scrolled away. DirBar owns it now, which is why the boot
  // screen must not carry a stale copy.
  it('does not list directory contents, which the directory bar owns', () => {
    expect(BOOT.some((line) => line.type === 'paths')).toBe(false)
  })
})

describe('entriesOf', () => {
  // ls and the directory bar both call this, so agreeing here is what stops the
  // bar from disagreeing with the command.
  it('matches what ls prints, in the same order', () => {
    for (const cwd of ['/', '/contact', '/experience', '/publications', '/other']) {
      const path = cwd === '/' ? '.' : cwd
      expect(entriesOf(cwd, dirAt(cwd)).map((entry) => entry.name), cwd).toEqual(
        listing(path).map((entry) => entry.name),
      )
    }
  })

  it('gives every entry an absolute path and a real kind', () => {
    for (const entry of entriesOf('/', dirAt('/'))) {
      expect(entry.path, entry.name).toBe(`/${entry.name}`)
      expect(['dir', 'file'], entry.name).toContain(entry.kind)
    }
  })

  it('builds nested paths from the directory it is given', () => {
    for (const entry of entriesOf('/contact', dirAt('/contact'))) {
      expect(entry.path, entry.name).toBe(`/contact/${entry.name}`)
    }
  })

  // Sorting these alphabetically would bury the current job in the middle and
  // put the older paper first, so both are authored newest first.
  it('keeps the authored order where a directory asked for it', () => {
    expect(entriesOf('/experience', dirAt('/experience')).map((e) => e.name)).toEqual([
      'investorhub',
      'unimelb-csl',
      'allmediadesk',
    ])
    expect(entriesOf('/publications', dirAt('/publications')).map((e) => e.name)).toEqual([
      'multifidelity-optimisation',
      'cho-fed-batch-modelling',
    ])
    expect(entriesOf('/contact', dirAt('/contact')).map((e) => e.name)).toEqual([
      'linkedin',
      'email',
      'github',
    ])
  })
})
