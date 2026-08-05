import { formatBody } from '../fs/markup'
import { displayPath, locate, normalize, resolve } from '../fs/resolve'
import type { Dir } from '../fs/types'
import { childrenOf } from './nav'
import type { Command, Line } from './types'
import { error, ok, text } from './types'

/**
 * Says where a name was found when it was not where the visitor was standing.
 * The point is to teach the path, not to silently paper over the miss.
 */
const foundAt = (path: string): Line => text(`found at ${displayPath(path)}`, 'dim')

export const cat: Command = (args, ctx) => {
  const target = args[0]
  if (!target) return ok(error('usage: cat <file>'))
  const found = locate(ctx.root, ctx.cwd, target)
  if (!found) return ok(error(`cat: ${target}: No such file or directory`))
  if (found.node.kind === 'dir') return ok(error(`cat: ${target}: Is a directory`))

  const body = found.node.lines ?? formatBody(found.node.body)
  return { lines: found.elsewhere ? [foundAt(found.path), ...body] : body }
}

/**
 * The indent guides live in the entry's `name` so tree output stays clickable
 * without a second line type for decorated paths. `path` stays clean.
 */
function walk(dir: Dir, dirPath: string, prefix: string): Line[] {
  const base = dirPath === '/' ? '' : dirPath
  const children = childrenOf(dir)

  return children.flatMap((child, index) => {
    const last = index === children.length - 1
    const path = `${base}/${child.name}`
    const line: Line = {
      type: 'paths',
      entries: [
        { name: `${prefix}${last ? '└── ' : '├── '}${child.name}`, kind: child.kind, path },
      ],
    }
    if (child.kind !== 'dir') return [line]
    return [line, ...walk(child, path, `${prefix}${last ? '    ' : '│   '}`)]
  })
}

export const tree: Command = (args, ctx) => {
  const target = args[0] ?? '.'
  const node = resolve(ctx.root, ctx.cwd, target)
  if (!node) return ok(error(`tree: ${target}: No such file or directory`))
  if (node.kind === 'file') return ok(text(node.name))
  return { lines: [text('.'), ...walk(node, normalize(ctx.cwd, target), '')] }
}

export const open: Command = (args, ctx) => {
  const target = args[0]
  if (!target) return ok(error('usage: open <file>'))
  const found = locate(ctx.root, ctx.cwd, target)
  if (!found) return ok(error(`open: ${target}: No such file or directory`))
  if (found.node.kind === 'dir') return ok(error(`open: ${target}: Is a directory`))
  const { href } = found.node
  if (!href) return ok(error(`open: ${target}: no link to follow`))

  const opening = text(`opening ${href}`, 'dim')
  return {
    lines: found.elsewhere ? [foundAt(found.path), opening] : [opening],
    openUrl: href,
  }
}
