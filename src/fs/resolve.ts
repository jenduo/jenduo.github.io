import type { Dir, FsNode } from './types'

export function splitPath(input: string): string[] {
  return input.split('/').filter((segment) => segment.length > 0)
}

/** Turns any user-typed path into an absolute one. `/` is home. */
export function normalize(cwd: string, input: string): string {
  const isAbsolute = input.startsWith('/') || input.startsWith('~')
  const base = isAbsolute ? [] : splitPath(cwd)
  const segments = splitPath(isAbsolute ? input.replace(/^~/, '') : input)

  const out = [...base]
  for (const segment of segments) {
    if (segment === '.') continue
    if (segment === '..') {
      // pop() on an empty array is a no-op, which is why `..` at the root stays.
      out.pop()
      continue
    }
    out.push(segment)
  }
  return '/' + out.join('/')
}

/** Filename without its extension. Leading dots are kept, so `.bashrc` is whole. */
export function stem(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot <= 0 ? name : name.slice(0, dot)
}

/**
 * Exact name first, then a unique match ignoring the extension.
 *
 * So `cat resume` finds `resume.pdf`, and nobody has to guess whether a file
 * ends in `.md` or `.txt` before they can read it. Ambiguous stems resolve to
 * nothing rather than picking one arbitrarily.
 */
function findChild(dir: Dir, segment: string): FsNode | undefined {
  const exact = dir.children.find((child) => child.name === segment)
  if (exact) return exact

  const byStem = dir.children.filter((child) => stem(child.name) === segment)
  return byStem.length === 1 ? byStem[0] : undefined
}

export function resolve(root: Dir, cwd: string, input: string): FsNode | null {
  let node: FsNode = root
  for (const segment of splitPath(normalize(cwd, input))) {
    if (node.kind !== 'dir') return null
    // Annotated because `node` is reassigned from it, which otherwise makes the
    // inference circular under strict mode.
    const next: FsNode | undefined = findChild(node, segment)
    if (!next) return null
    node = next
  }
  return node
}

export function displayPath(path: string): string {
  return path === '/' ? '~' : '~' + path
}

export interface Located {
  node: FsNode
  /** Absolute path of what was found, so a caller can say where it looked. */
  path: string
  /** True when the literal path missed and the name was found elsewhere. */
  elsewhere: boolean
}

/** Every node in the tree, each with its absolute path. */
function walk(dir: Dir, base: string): Located[] {
  return dir.children.flatMap((child) => {
    const path = `${base === '/' ? '' : base}/${child.name}`
    const here: Located = { node: child, path, elsewhere: true }
    return child.kind === 'dir' ? [here, ...walk(child, path)] : [here]
  })
}

/**
 * Resolves a path, and if that misses, looks for the name anywhere in the tree.
 *
 * The site tells visitors to type `open article`, which only resolves from
 * inside `publications/`. Rather than answering a correct-looking command with
 * `No such file`, a bare name that exists in exactly one place is found. Callers
 * report the real path, so the shortcut teaches the layout instead of hiding it.
 *
 * Deliberately narrow: anything containing a slash was meant literally, and an
 * ambiguous name finds nothing rather than guessing between two files.
 */
export function locate(root: Dir, cwd: string, input: string): Located | null {
  const direct = resolve(root, cwd, input)
  if (direct) return { node: direct, path: normalize(cwd, input), elsewhere: false }

  if (input.includes('/') || input === '.' || input === '..') return null

  const matches = walk(root, '/').filter(
    ({ node }) => node.name === input || stem(node.name) === input,
  )
  return matches.length === 1 ? matches[0] : null
}
