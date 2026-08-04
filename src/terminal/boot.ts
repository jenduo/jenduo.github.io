import { sortNodes } from '../commands/nav'
import type { Line, PathEntry } from '../commands/types'
import { hero, text } from '../commands/types'
import { root } from '../fs/tree'

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
 * Everything at the top of the filesystem, in the same order `ls` would print
 * it. Derived rather than listed: this used to be a hand-written copy of the
 * root, and it silently fell out of date the moment the tree changed, hiding
 * `education` and `resume.pdf` from anyone who never ran `ls`.
 */
const ROOT_ENTRIES: PathEntry[] = sortNodes(root.children).map((child) => ({
  name: child.name,
  kind: child.kind,
  path: `/${child.name}`,
}))

export const BOOT: Line[] = [
  { type: 'banner', rows: BANNER },
  hero("hi it's me, Jen :)"),
  text(''),
  text('Jennifer Duong, Melbourne based full-stack engineer', 'bright'),
  text("a lifetime's portfolio, reduced to a shell", 'dim'),
  text(''),
  // Kept short so it does not wrap at phone width.
  text("start with 'whoami', or click anything below.", 'dim'),
  text(''),
  { type: 'paths', entries: ROOT_ENTRIES },
  text(''),
]
