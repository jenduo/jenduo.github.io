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

/**
 * figlet -f digital "hi it's me, Jen :)", 37 columns.
 *
 * A phone cannot hold 67 columns at a readable size, but it can hold 37, so it
 * gets art too rather than a line of large text. This font is boxed, which is
 * what survives being small: the strokes cannot thin out or merge the way the
 * standard font's do.
 */
const PHONE_BANNER = [
  '+-+-+ +-+-+-+-+ +-+-+-+ +-+-+-+ +-+-+',
  "|h|i| |i|t|'|s| |m|e|,| |J|e|n| |:|)|",
  '+-+-+ +-+-+-+-+ +-+-+-+ +-+-+-+ +-+-+',
]

export const BOOT: Line[] = [
  { type: 'banner', rows: BANNER, fits: 'wide' },
  { type: 'banner', rows: PHONE_BANNER, fits: 'phone' },
  hero("hi it's me, Jen :)"),
  text(''),
  text('Jennifer Duong, Melbourne based full-stack engineer', 'bright'),
  text("a lifetime's portfolio, reduced to a shell", 'dim'),
  text(''),
  // No "above" or "below": the directory bar is at the top on a desktop and at
  // the bottom on a phone, so the wording cannot name a direction.
  hint("type 'help', or click any file or folder.", 'dim'),
  text(''),
]
