import type { Bloom } from '../terminal/bloom'
import type { Dir } from '../fs/types'
import type { ThemeName } from './themes'

export type Tone = 'default' | 'dim' | 'bright' | 'accent' | 'error'

export interface PathEntry {
  name: string
  kind: 'dir' | 'file'
  /** Absolute, so a click does not depend on the cwd at click time. */
  path: string
}

export type Line =
  /** An echoed prompt line, e.g. `~/projects $ ls`. */
  | { type: 'prompt'; cwd: string; input: string }
  /** See terminal.css: `hero` is display size, `body` and `bullet` are file prose. */
  | { type: 'text'; text: string; tone?: Tone; variant?: 'hero' | 'body' | 'bullet' }
  /**
   * An ASCII banner. All rows travel as one line so the component that renders
   * them can animate them as a single unit. There are two, a wide one for
   * desktops and a compact one for phones; terminal.css shows exactly one.
   */
  | {
      type: 'banner'
      rows: string[]
      fits: 'wide' | 'phone'
      flowers?: Flower[]
      /** Cells of the art that are drawn as flowers. See terminal/bloom.ts. */
      blooms?: Bloom[]
    }
  /** A file's title, framed and centred, with an optional second line. */
  | { type: 'titlecard'; title: string; subtitle?: string }
  /** Path names rendered as clickable buttons. */
  | { type: 'paths'; entries: PathEntry[] }
  /**
   * `type 'open github' to see my repos.`, with the command clickable for
   * visitors who would rather not type. `after` is the rest of the sentence.
   */
  | HintLine
  /** A labelled row of technologies, each with an optional logo. */
  | { type: 'icons'; label: string; items: IconItem[] }

/**
 * A flower grown into the banner's empty space. Placed on the art's own grid, in
 * cells rather than pixels, so it lands where nothing is drawn at any font size.
 * Fractional positions are deliberate: a bed of flowers on exact cell centres
 * reads as a pattern rather than as something growing.
 */
export interface Flower {
  glyph: string
  /** Column and row on the art grid, fractions allowed. */
  col: number
  row: number
  /** Size relative to a character cell, so a flower can be bigger than a letter. */
  size: number
}

export interface HintLine {
  type: 'hint'
  /** Reads `type 'cmd' ...` in prose, `try 'cmd'` when correcting a mistake. */
  verb: 'type' | 'try'
  /** Shown in quotes, exactly as a visitor would type it. */
  command: string
  /**
   * What a click actually runs, when that differs from what is shown. A hint
   * names its file the way it reads from its own directory, so the click carries
   * the full path and works from anywhere, while the text stays short.
   */
  run?: string
  /** The rest of the sentence, from the closing quote onwards. */
  after: string
  tone?: Tone
  variant?: 'body'
}

/** A correction: `try 'cat publications/article'`, clickable like any hint. */
export const tryHint = (command: string): Line => ({
  type: 'hint',
  verb: 'try',
  command,
  after: '',
  tone: 'dim',
})

export interface IconItem {
  name: string
  /** SVG path data on a 24x24 viewBox. Absent for anything with no logo. */
  path?: string
}

export interface ShellContext {
  root: Dir
  cwd: string
  history: string[]
}

export interface CommandResult {
  lines: Line[]
  /** Set to move the shell to a new directory. */
  cwd?: string
  /**
   * The file this output is about, as an absolute path. The URL follows it, so a
   * visitor can send someone the entry they are looking at rather than the front
   * door. Any command that does not set it clears it.
   */
  focus?: string
  /** Set to wipe the scrollback. */
  clear?: boolean
  /** Set to navigate the browser to a URL. */
  openUrl?: string
  /** Set to recolour the terminal. */
  theme?: ThemeName
}

/**
 * Commands return data and never render. That is what makes them testable
 * without a DOM, and why `cd` returns a new cwd instead of mutating anything.
 */
export type Command = (args: string[], ctx: ShellContext) => CommandResult

export interface CommandSpec {
  name: string
  usage: string
  summary: string
  /** Hidden from `help`: the easter eggs. */
  hidden?: boolean
  run: Command
}

export const text = (value: string, tone?: Tone): Line => ({ type: 'text', text: value, tone })

/**
 * Turns `type 'cmd' rest of sentence` into a hint line, or returns null if the
 * row is not one. The whole site writes these the same way, so one pattern
 * covers every hint and there is nothing to keep in sync by hand.
 */
export function asHint(row: string, tone?: Tone): HintLine | null {
  const match = row.match(/^type '([^']+)'(.*)$/)
  return match ? { type: 'hint', verb: 'type', command: match[1], after: match[2], tone } : null
}

export const hero = (value: string): Line => ({ type: 'text', text: value, variant: 'hero' })
export const error = (message: string): Line => ({ type: 'text', text: message, tone: 'error' })
export const ok = (...lines: Line[]): CommandResult => ({ lines })
