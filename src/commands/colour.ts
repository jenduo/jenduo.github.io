import { THEMES, isTheme } from './themes'
import type { Command } from './types'
import { error, ok, text } from './types'

const OPTIONS = THEMES.join(' · ')

/**
 * Recolours the terminal.
 *
 * Returns the chosen theme as data; the shell applies it. Keeping the DOM out
 * of here is what lets the command be tested without a browser, same as every
 * other command.
 */
export const colour: Command = (args) => {
  const [name] = args

  if (!name) {
    return ok(text(`usage: colour <name>`), text(`  ${OPTIONS}`, 'dim'))
  }

  if (!isTheme(name)) {
    return ok(
      error(`colour: ${name}: no such colour`),
      text(`  pick one of: ${OPTIONS}`, 'dim'),
    )
  }

  return { lines: [text(`colour set to ${name}`, 'dim')], theme: name }
}
