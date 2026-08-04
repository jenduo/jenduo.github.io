import { resolve } from '../fs/resolve'
import type { Command } from './types'
import { error, ok, text } from './types'

/** Longer than this and echoing it back would flood the screen. */
const ECHO_LIMIT = 72

/**
 * Puts a file on the clipboard.
 *
 * A separate command rather than a side effect of `cat`, because silently
 * replacing a visitor's clipboard whenever they read something is hostile.
 * Nothing in a real shell both prints and copies either.
 *
 * Returns the text as data; the shell does the writing, so this stays testable
 * without a browser like every other command.
 */
export const copy: Command = (args, ctx) => {
  const target = args[0]
  if (!target) return ok(error('usage: copy <file>'))

  const node = resolve(ctx.root, ctx.cwd, target)
  if (!node) return ok(error(`copy: ${target}: No such file or directory`))
  if (node.kind === 'dir') return ok(error(`copy: ${target}: Is a directory`))

  // `copyText` is the one useful line, so `copy email` gives the address rather
  // than the address plus the surrounding prose.
  const value = (node.copyText ?? node.body).trim()
  if (!value) return ok(error(`copy: ${target}: nothing to copy`))

  const single = !value.includes('\n')
  const note =
    single && value.length <= ECHO_LIMIT
      ? `copied: ${value}`
      : `copied ${value.length} characters to the clipboard`

  return { lines: [text(note, 'dim')], copy: value }
}
