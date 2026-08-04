import { childrenOf } from '../commands/nav'
import type { Dir } from '../fs/types'

/**
 * Idle suggestions at the front door.
 *
 * Every entry must be a real, runnable command. The suggestion is one keypress
 * from executing, so anything that is not a command would hand a visitor
 * `command not found` as their first interaction with the site.
 *
 * Hand-picked rather than derived: at the root the useful thing is a tour, not a
 * list of what happens to sit in the home directory.
 */
export const SUGGESTIONS = ['whoami', 'ls experience', 'cat skills', 'tree', 'ls publications']

/** How many of each kind to offer, so a large directory does not drone on. */
const MAX_FILES = 3
const MAX_DIRS = 2

/**
 * What to suggest inside a directory, named after what is actually in it.
 *
 * Walking into a room should tell you what is worth doing there, and a real
 * filename can be accepted as printed. The root keeps its curated tour instead,
 * because a first-time visitor wants an introduction, not an inventory.
 */
export function suggestionsFor(dir: Dir | null, cwd: string): string[] {
  if (cwd === '/' || !dir) return SUGGESTIONS

  const sorted = childrenOf(dir)
  const suggestions = [
    ...sorted
      .filter((child) => child.kind === 'file')
      .slice(0, MAX_FILES)
      .map((child) => `cat ${child.name}`),
    ...sorted
      .filter((child) => child.kind === 'dir')
      .slice(0, MAX_DIRS)
      .map((child) => `cd ${child.name}`),
    'cd ..',
  ]

  // An empty directory has nothing worth cat-ing, so offer the way out only.
  return suggestions
}

export interface GhostFrame {
  /** What to display this tick, possibly a partial command. */
  shown: string
  /**
   * The complete command this frame is building toward. Accepting always runs
   * this, never `shown`: pressing the accept key mid-animation must not run a
   * half-typed command like `cat contact`.
   */
  full: string
}

/**
 * Expands suggestions into one frame per animation tick: typed out a character
 * at a time, held, then blanked before the next.
 *
 * Modelling it as a flat frame list keeps the animation pure and testable. The
 * hook only has to advance an index on an interval.
 */
export function ghostFrames(
  suggestions: string[],
  holdTicks = 22,
  gapTicks = 5,
): GhostFrame[] {
  const frames: GhostFrame[] = []

  for (const full of suggestions) {
    for (let i = 1; i <= full.length; i++) frames.push({ shown: full.slice(0, i), full })
    for (let i = 0; i < holdTicks; i++) frames.push({ shown: full, full })
    // Blank frames carry no command, so the accept key cannot fire on them.
    for (let i = 0; i < gapTicks; i++) frames.push({ shown: '', full: '' })
  }

  return frames
}
