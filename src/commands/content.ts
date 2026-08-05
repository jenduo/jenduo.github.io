import { formatBody } from '../fs/markup'
import { displayPath, normalize, resolve } from '../fs/resolve'
import type { Dir } from '../fs/types'
import { childrenOf } from './nav'
import { missing } from './missing'
import type { Command, Line } from './types'
import { error, ok, text } from './types'

/** The directory a path sits in. */
function parentOf(path: string): string {
  const cut = path.lastIndexOf('/')
  return cut <= 0 ? '/' : path.slice(0, cut)
}

/**
 * Points each hint's click at the full path of what it names.
 *
 * A hint is written the way it reads from its own directory, `open article`, so
 * clicking one from anywhere else would otherwise fail. The text stays as
 * written, which is what a visitor would type once they are in the right place;
 * only the click target changes.
 */
function bindHints(lines: Line[], root: Dir, dirPath: string): Line[] {
  return lines.map((line) => {
    if (line.type !== 'hint') return line

    const space = line.command.indexOf(' ')
    if (space < 0) return line
    const verb = line.command.slice(0, space)
    const arg = line.command.slice(space + 1)

    if (!resolve(root, dirPath, arg)) return line
    return { ...line, run: `${verb} ${displayPath(normalize(dirPath, arg))}` }
  })
}

export const cat: Command = (args, ctx) => {
  const target = args[0]
  if (!target) return ok(error('usage: cat <file>'))
  const node = resolve(ctx.root, ctx.cwd, target)
  if (!node) return { lines: missing('cat', target, ctx) }
  if (node.kind === 'dir') return ok(error(`cat: ${target}: Is a directory`))

  const body = node.lines ?? formatBody(node.body)
  return { lines: bindHints(body, ctx.root, parentOf(normalize(ctx.cwd, target))) }
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
  if (!node) return { lines: missing('tree', target, ctx) }
  if (node.kind === 'file') return ok(text(node.name))
  return { lines: [text('.'), ...walk(node, normalize(ctx.cwd, target), '')] }
}

export const open: Command = (args, ctx) => {
  const target = args[0]
  if (!target) return ok(error('usage: open <file>'))
  const node = resolve(ctx.root, ctx.cwd, target)
  if (!node) return { lines: missing('open', target, ctx) }
  if (node.kind === 'dir') return ok(error(`open: ${target}: Is a directory`))
  if (!node.href) return ok(error(`open: ${target}: no link to follow`))
  return { lines: [text(`opening ${node.href}`, 'link')], openUrl: node.href }
}
