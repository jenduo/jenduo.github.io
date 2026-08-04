/**
 * The palettes on offer. Deliberately a closed set: each one is hand-tuned in
 * terminal.css, so an arbitrary colour would have no styling behind it.
 *
 * This module imports nothing, so both the command contracts and the command
 * itself can depend on it without a cycle.
 */
export const THEMES = ['pink', 'blue', 'green', 'purple', 'white'] as const

export type ThemeName = (typeof THEMES)[number]

export function isTheme(value: string): value is ThemeName {
  return (THEMES as readonly string[]).includes(value)
}
