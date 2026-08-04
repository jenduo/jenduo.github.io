/**
 * Signal-interference effect for the ASCII banner.
 *
 * Characters are replaced one for one and spaces are left alone, so the grid
 * never reflows and the silhouette of the lettering stays recognisable while
 * the strokes scramble.
 */
const GLITCH_CHARS = '!<>_/\\[]{}=+*^?#$%&|~'

/** `rand` is injected so the animation can be tested deterministically. */
export function glitchRow(row: string, intensity: number, rand: () => number): string {
  let out = ''
  for (const char of row) {
    if (char === ' ' || rand() >= intensity) {
      out += char
      continue
    }
    out += GLITCH_CHARS[Math.floor(rand() * GLITCH_CHARS.length)]
  }
  return out
}

export function glitchRows(rows: string[], intensity: number, rand: () => number): string[] {
  return rows.map((row) => glitchRow(row, intensity, rand))
}

/**
 * A burst that decays to nothing, so the banner resolves back to itself rather
 * than needing a separate restore step.
 */
export function glitchIntensity(frame: number, frames: number): number {
  if (frame >= frames) return 0
  return 0.45 * (1 - frame / frames)
}
