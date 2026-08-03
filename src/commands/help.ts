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
        // Two short lines rather than one long one, so neither wraps on a phone.
        text('  tab completes · ↑ ↓ walks history', 'dim'),
        text('  or just click any filename', 'dim'),
      ],
    }
  }
}
