import { formatBody } from '../fs/markup'
import { normalize, resolve } from '../fs/resolve'
import type { Dir } from '../fs/types'
import { childrenOf } from './nav'
import type { Command, Line } from './types'
import { error, ok, text } from './types'

export const cat: Command = (args, ctx) => {
  const target = args[0]
  if (!target) return ok(error('usage: cat <file>'))
  const node = resolve(ctx.root, ctx.cwd, target)
  if (!node) return ok(error(`cat: ${target}: No such file or directory`))
  if (node.kind === 'dir') return ok(error(`cat: ${target}: Is a directory`))
  if (node.lines) return { lines: node.lines }
  return { lines: formatBody(node.body) }
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
  const node = resolve(ctx.root, ctx.cwd, target)
  if (!node) return ok(error(`open: ${target}: No such file or directory`))
  if (node.kind === 'dir') return ok(error(`open: ${target}: Is a directory`))
  if (!node.href) return ok(error(`open: ${target}: no link to follow`))
  return { lines: [text(`opening ${node.href}`, 'dim')], openUrl: node.href }
}
