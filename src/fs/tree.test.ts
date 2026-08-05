import { describe, expect, it } from 'vitest'
import { resolve } from './resolve'
import { root } from './tree'
import type { Dir, FileNode } from './types'

/** Every file in the tree, paired with the directory it sits in. */
function files(dir: Dir, dirPath: string): { file: FileNode; dirPath: string }[] {
  return dir.children.flatMap((child) =>
    child.kind === 'dir'
      ? files(child, `${dirPath === '/' ? '' : dirPath}/${child.name}`)
      : [{ file: child, dirPath }],
  )
}

const linkable = files(root, '/').filter(({ file }) => file.href)

/**
 * Every file that links somewhere tells the visitor how to follow it, in one
 * consistent form: `type 'open <name>' to ...`. These assertions run over the
 * real tree, not a fixture, because the point is to catch the content drifting.
 */
describe('open hints', () => {
  it('is on every file that has a link', () => {
    expect(linkable.length).toBeGreaterThan(0)
    for (const { file } of linkable) {
      expect(file.body, `${file.name} has a link but no hint`).toMatch(/type 'open [^']+' to /)
    }
  })

  // A hint naming a file that was since renamed sends the visitor to an error.
  it('names a target that resolves to the file it appears in', () => {
    for (const { file, dirPath } of linkable) {
      const named = file.body.match(/type 'open ([^']+)'/)?.[1]
      expect(named, `${file.name} has no target in its hint`).toBeDefined()
      expect(resolve(root, dirPath, named!), `open ${named} does not reach ${file.name}`).toBe(file)
    }
  })
})
