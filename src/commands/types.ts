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
  /** `hero` renders at display size. See terminal.css. */
  | { type: 'text'; text: string; tone?: Tone; variant?: 'hero' }
  /**
   * The ASCII banner. All rows travel as one line so the component that renders
   * them can animate them as a single unit.
   */
  | { type: 'banner'; rows: string[] }
  /** Path names rendered as clickable buttons. */
  | { type: 'paths'; entries: PathEntry[] }
  /** A labelled row of technologies, each with an optional logo. */
  | { type: 'icons'; label: string; items: IconItem[] }

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

export const hero = (value: string): Line => ({ type: 'text', text: value, variant: 'hero' })
export const error = (message: string): Line => ({ type: 'text', text: message, tone: 'error' })
export const ok = (...lines: Line[]): CommandResult => ({ lines })
