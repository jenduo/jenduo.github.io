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

export function resolve(root: Dir, cwd: string, input: string): FsNode | null {
  let node: FsNode = root
  for (const segment of splitPath(normalize(cwd, input))) {
    if (node.kind !== 'dir') return null
    const next = node.children.find((child) => child.name === segment)
    if (!next) return null
    node = next
  }
  return node
}

export function displayPath(path: string): string {
  return path === '/' ? '~' : '~' + path
}
