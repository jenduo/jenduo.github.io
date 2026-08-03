import { COMMANDS } from '../commands/index'
import { resolve } from '../fs/resolve'
import type { Dir } from '../fs/types'

/** Completes only when there is exactly one candidate, so nothing is guessed. */
export function complete(input: string, root: Dir, cwd: string): string {
  // Keeps the whitespace runs so the head can be rebuilt verbatim.
  const parts = input.split(/(\s+)/)

  if (parts.length === 1) {
    const matches = COMMANDS.filter(
      (command) => !command.hidden && command.name.startsWith(input),
    )
    return matches.length === 1 ? `${matches[0].name} ` : input
  }

  const fragment = parts[parts.length - 1]
  const slash = fragment.lastIndexOf('/')
  const dirPart = slash === -1 ? '.' : fragment.slice(0, slash + 1)
  const namePart = slash === -1 ? fragment : fragment.slice(slash + 1)

  const dir = resolve(root, cwd, dirPart)
  if (!dir || dir.kind !== 'dir') return input

  const matches = dir.children.filter((child) => child.name.startsWith(namePart))
  if (matches.length !== 1) return input

  const [match] = matches
  const head = parts.slice(0, -1).join('')
  const prefix = dirPart === '.' ? '' : dirPart
  return `${head}${prefix}${match.name}${match.kind === 'dir' ? '/' : ' '}`
}
