import { childrenOf } from './nav'
import type { Dir } from '../fs/types'
import type { Command, Line } from './types'
import { error, ok, text } from './types'

/** How much of a line to show around a hit, in characters. */
const WINDOW = 72

/** How many hits to print per file before saying how many are left. */
const PER_FILE = 3

export interface FileMatch {
  /** Absolute path, so the result stays clickable from anywhere. */
  path: string
  name: string
  /** One per hit, already trimmed to a readable window. */
  excerpts: string[]
  /** Hits beyond the printed ones. */
  extra: number
}

/**
 * A readable slice of a line around the hit.
 *
 * Bodies are authored as one long line per paragraph, so printing the matching
 * line whole, as grep does, would print the paragraph. This centres a window on
 * the hit and marks either end that was cut.
 */
export function excerpt(line: string, needle: string, window = WINDOW): string {
  // The markup is for the renderer, not for reading back in a search result.
  const text = line.replace(/^#{1,2}\s+/, '').replace(/^-\s+/, '')
  const at = text.toLowerCase().indexOf(needle.toLowerCase())
  if (at < 0 || text.length <= window) return text

  const start = Math.max(0, at + needle.length / 2 - window / 2)
  const end = Math.min(text.length, start + window)
  // Snap to word boundaries so the window does not cut mid-word at either end.
  const from = start === 0 ? 0 : text.indexOf(' ', start) + 1 || start
  const to = end === text.length ? end : text.lastIndexOf(' ', end)

  return `${from > 0 ? '…' : ''}${text.slice(from, to).trim()}${to < text.length ? '…' : ''}`
}

/**
 * Every file whose name or body contains the needle, in tree order.
 *
 * Case-insensitive and literal: a visitor searching a portfolio wants to find
 * the word they typed, and a stray `(` in a real regex would hand them a syntax
 * error instead of an answer.
 */
export function searchTree(dir: Dir, dirPath: string, needle: string): FileMatch[] {
  const base = dirPath === '/' ? '' : dirPath
  const lower = needle.toLowerCase()

  return childrenOf(dir).flatMap((child): FileMatch[] => {
    const path = `${base}/${child.name}`
    if (child.kind === 'dir') return searchTree(child, path, needle)

    const hits = child.body
      .split('\n')
      .filter((line) => line.toLowerCase().includes(lower))
      .map((line) => excerpt(line, needle))

    // A filename can match on its own, which is worth reporting even with
    // nothing in the body: it is still where the visitor wants to go.
    if (hits.length === 0 && !child.name.toLowerCase().includes(lower)) return []

    return [
      {
        path,
        name: child.name,
        excerpts: hits.slice(0, PER_FILE),
        extra: Math.max(0, hits.length - PER_FILE),
      },
    ]
  })
}

/**
 * Searches the whole site, not the working directory.
 *
 * The tree is small and a visitor typing grep is looking for something, not
 * scoping a search: answering "nothing here" while the answer sits one directory
 * up would be faithful to a shell and useless to a person.
 */
export const grep: Command = (args, ctx) => {
  const needle = args.join(' ').trim()
  if (!needle) return ok(error('usage: grep <text>'))

  const matches = searchTree(ctx.root, '/', needle)
  if (matches.length === 0) return ok(text(`grep: nothing matches "${needle}"`, 'dim'))

  const lines: Line[] = matches.flatMap((match) => [
    { type: 'paths', entries: [{ name: match.path, kind: 'file', path: match.path }] },
    ...match.excerpts.map((line) => text(`  ${line}`, 'dim')),
    ...(match.extra > 0
      ? [text(`  and ${match.extra} more ${match.extra === 1 ? 'line' : 'lines'}`, 'dim')]
      : []),
  ])

  const files = matches.length === 1 ? '1 file' : `${matches.length} files`
  return { lines: [text(`${files} matching "${needle}"`, 'dim'), text(''), ...lines] }
}
