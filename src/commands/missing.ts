import { displayPath, locate } from '../fs/resolve'
import type { Line, ShellContext } from './types'
import { error, tryHint } from './types'

/**
 * `No such file`, plus where the name actually is when it exists in exactly one
 * other place.
 *
 * The typed command is deliberately not run from elsewhere. A shell resolves
 * paths against the working directory, and quietly ignoring that would teach
 * visitors the opposite of how the thing they are using works. The correction is
 * a clickable hint, so following it costs one click and still shows what the
 * right command looks like.
 *
 * Its own module because both nav.ts and content.ts need it, and importing it
 * from either would make the two circular.
 */
export function missing(name: string, target: string, ctx: ShellContext): Line[] {
  const lines = [error(`${name}: ${target}: No such file or directory`)]
  const found = locate(ctx.root, ctx.cwd, target)
  if (found?.elsewhere) lines.push(tryHint(`${name} ${displayPath(found.path)}`))
  return lines
}
