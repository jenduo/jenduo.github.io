/**
 * Pointer-local interference for the ASCII banner.
 *
 * Characters are replaced one for one and spaces are left alone, so the grid
 * never reflows and the silhouette of the lettering stays readable while the
 * strokes near the cursor scramble.
 */
const GLITCH_CHARS = '!<>_/\\[]{}=+*^?#$%&|~'

export interface Spotlight {
  /** Cursor position in character cells, fractional. */
  col: number
  row: number
  /** Reach of the effect, measured in columns. */
  radius: number
  /**
   * Cell height divided by cell width. A monospace cell is roughly twice as
   * tall as it is wide, so without this the "circle" would be a tall ellipse.
   */
  aspect: number
}

/** 1 at the centre, falling linearly to 0 at the edge of the radius. */
export function falloff(distance: number, radius: number): number {
  if (radius <= 0 || distance >= radius) return 0
  return 1 - distance / radius
}

/**
 * The radius partway through its growth, so the spotlight opens up the longer
 * the pointer rests on the banner. Clamped at both ends, so a frame count past
 * the end simply holds at `to`.
 */
export function radiusAt(frame: number, from: number, to: number, frames: number): number {
  if (frames <= 0) return to
  const progress = Math.min(1, Math.max(0, frame / frames))
  return from + (to - from) * progress
}

/**
 * `rand` is injected so the animation can be tested deterministically.
 * A null spotlight returns the rows untouched.
 */
export function spotlightRows(
  rows: string[],
  spot: Spotlight | null,
  rand: () => number,
): string[] {
  if (!spot) return rows

  return rows.map((row, rowIndex) => {
    let out = ''

    for (let col = 0; col < row.length; col++) {
      const char = row[col]
      if (char === ' ') {
        out += char
        continue
      }

      const dx = col - spot.col
      const dy = (rowIndex - spot.row) * spot.aspect
      const chance = falloff(Math.hypot(dx, dy), spot.radius)

      out += rand() < chance ? GLITCH_CHARS[Math.floor(rand() * GLITCH_CHARS.length)] : char
    }

    return out
  })
}
