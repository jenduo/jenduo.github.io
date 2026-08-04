import type { CommandResult, Line } from '../commands/types'

/**
 * Folds a command's output into the scrollback.
 *
 * `clear` resets to the boot header rather than to nothing. The header carries
 * the banner, who Jen is, and the clickable entry points, so wiping it would
 * strand a visitor at a bare prompt with nothing to act on.
 */
export function nextLines(previous: Line[], result: CommandResult, boot: Line[]): Line[] {
  return result.clear ? boot : [...previous, ...result.lines]
}
