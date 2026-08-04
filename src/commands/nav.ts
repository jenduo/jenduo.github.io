import { displayPath, normalize, resolve } from '../fs/resolve'
import type { FsNode } from '../fs/types'
import type { Command, PathEntry } from './types'
import { error, ok, text } from './types'

export const pwd: Command = (_args, ctx) => ok(text(displayPath(ctx.cwd)))

/** Directories first, then alphabetical within each group. */
export function sortNodes(nodes: FsNode[]): FsNode[] {
  return [...nodes].sort((a, b) =>
    a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'dir' ? -1 : 1,
  )
}

function entriesOf(dirPath: string, children: FsNode[]): PathEntry[] {
  const base = dirPath === '/' ? '' : dirPath
  return sortNodes(children).map(({ name, kind }) => ({ name, kind, path: `${base}/${name}` }))
}

export const ls: Command = (args, ctx) => {
  const target = args[0] ?? '.'
  const node = resolve(ctx.root, ctx.cwd, target)
  if (!node) return ok(error(`ls: ${target}: No such file or directory`))
  if (node.kind === 'file') return ok(text(node.name))
  return ok({ type: 'paths', entries: entriesOf(normalize(ctx.cwd, target), node.children) })
}

export const cd: Command = (args, ctx) => {
  const target = args[0] ?? '~'
  const node = resolve(ctx.root, ctx.cwd, target)
  if (!node) return ok(error(`cd: ${target}: No such file or directory`))
  if (node.kind === 'file') return ok(error(`cd: ${target}: Not a directory`))

  return { lines: [], cwd: normalize(ctx.cwd, target) }
}
