import type { Command, CommandSpec } from './types'
import { text } from './types'

/**
 * `commands` is a thunk to avoid a circular import with the registry, and so
 * that help can never drift out of sync with what actually exists.
 */
export function makeHelp(commands: () => CommandSpec[]): Command {
  return () => {
    const visible = commands().filter((command) => !command.hidden)
    const width = Math.max(...visible.map((command) => command.usage.length))
    return {
      lines: [
        text('available commands', 'accent'),
        text(''),
        ...visible.map((command) => text(`  ${command.usage.padEnd(width + 3)}${command.summary}`)),
        text(''),
        // Short lines rather than one long one, so none of them wraps on a phone.
        text('  tab completes · ↑ ↓ walks history', 'dim'),
        // The two most reached-for. The rest of the readline keys are muscle
        // memory for anyone who would use them, and listing them all would wrap.
        text('  ctrl+c cancels · ctrl+l clears', 'dim'),
        text('  or just click any filename', 'dim'),
      ],
    }
  }
}
