/**
 * Idle suggestions for the input.
 *
 * Every entry must be a real, runnable command. The suggestion is one keypress
 * from executing, so anything that is not a command would hand a visitor
 * `command not found` as their first interaction with the site.
 */
export const SUGGESTIONS = ['whoami', 'ls experience', 'cat skills', 'tree', 'ls publications']

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
