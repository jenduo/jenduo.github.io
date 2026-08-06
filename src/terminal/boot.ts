import type { Flower, Line, Tone } from '../commands/types'
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
 * figlet -f digital, split across two rows: 23 columns instead of 37.
 *
 * A phone cannot hold the 67-column banner at a readable size, but it can hold
 * this. Splitting the greeting rather than shrinking it is what buys the size:
 * the art is scaled to fill the line, so a narrower block is a bigger one.
 *
 * This font is boxed, which is what survives being small. The standard font's
 * strokes thin out and merge, which is why a phone never got art before.
 */
const PHONE_BANNER = [
  '+-+-+ +-+-+-+-+ +-+-+-+',
  "|h|i| |i|t|'|s| |m|e|,|",
  '+-+-+ +-+-+-+-+ +-+-+-+',
  '',
  '+-+-+-+ +-+-+',
  '|J|e|n| |:|)|',
  '+-+-+-+ +-+-+',
]

/**
 * Flowers for the wide banner, grown into the gaps rather than set beside it.
 *
 * Every position sits inside an empty run of the art: row 5 is clear from column
 * 0 to 38 and again from 41 to 62, and row 0 from 18 to 47. Sizes above 1 make
 * them larger than the letters, which is the point, so the taller ones sit on the
 * bottom row where there is nothing above them to crowd.
 */
const WIDE_FLOWERS: Flower[] = [
  { glyph: '✿', col: 2.4, row: 4.6, size: 3 },
  { glyph: '✽', col: 6.4, row: 5.05, size: 2.1 },
  { glyph: '❀', col: 9.6, row: 4.7, size: 2.6 },
  { glyph: '✧', col: 13.6, row: 5.1, size: 1.7 },
  { glyph: '❀', col: 20.8, row: 0.02, size: 2 },
  { glyph: '✿', col: 25.6, row: 0.1, size: 1.5 },
  { glyph: '✽', col: 43.4, row: 4.65, size: 2.7 },
  { glyph: '❀', col: 47.8, row: 5.1, size: 1.8 },
  { glyph: '✿', col: 51, row: 4.75, size: 2.3 },
  { glyph: '✧', col: 55, row: 5.15, size: 1.5 },
]

export const BOOT: Line[] = [
  { type: 'banner', rows: BANNER, fits: 'wide', flowers: WIDE_FLOWERS },
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
