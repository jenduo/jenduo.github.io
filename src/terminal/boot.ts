import type { Line, Tone } from '../commands/types'
import { asHint, hero, text } from '../commands/types'

/** Same wording as the file bodies, so it is one pattern everywhere. */
function hint(row: string, tone?: Tone): Line {
  const line = asHint(row, tone)
  if (!line) throw new Error(`not a hint: ${row}`)
  return line
}

// figlet -f standard "hi it's me, Jen :)", 67 columns, smiley included.
// Shown on viewports wide enough to hold it; below 680px terminal.css swaps in
// the `hero` line instead.
const BANNER = [
  " _     _   _ _   _                              _              __  ",
  '| |__ (_) (_) |_( )___   _ __ ___   ___        | | ___ _ __    \\ \\ ',
  "| '_ \\| | | | __|// __| | '_ ` _ \\ / _ \\    _  | |/ _ \\ '_ \\  (_) |",
  '| | | | | | | |_  \\__ \\ | | | | | |  __/_  | |_| |  __/ | | |  _| |',
  '|_| |_|_| |_|\\__| |___/ |_| |_| |_|\\___( )  \\___/ \\___|_| |_| (_) |',
  '                                       |/                      /_/ ',
]

export const BOOT: Line[] = [
  { type: 'banner', rows: BANNER },
  hero("hi it's me, Jen :)"),
  text(''),
  text('Jennifer Duong, Melbourne based full-stack engineer', 'bright'),
  text("a lifetime's portfolio, reduced to a shell", 'dim'),
  text(''),
  // Kept short so it does not wrap at phone width. "above" because the
  // clickable directory bar sits at the top of the terminal, not in the output.
  hint("type 'help', or click anything above.", 'dim'),
  text(''),
]
