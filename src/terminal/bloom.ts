/**
 * Flowers that are part of the art rather than decoration around it.
 *
 * A bloom replaces one character of the banner, so the letter is drawn partly in
 * flowers: the dots on the two i's, and the two dots of the colon in the smiley.
 * Those cells were chosen because they are already round, so a flower reads as
 * the thing it stands in for rather than as something dropped on top.
 */
export interface Bloom {
  row: number
  col: number
  glyph: string
}

/** A run of plain characters, or a single bloomed cell. */
export type Segment = { text: string } | { glyph: string }

/**
 * Splits a row into segments, with the bloomed cells on their own so they can be
 * coloured apart from the art.
 *
 * Takes the row as it is about to be drawn rather than the source row, so a cell
 * the scramble has already changed still blooms: the two effects share the art and
 * must not fight over it.
 */
export function bloomRow(row: string, blooms: Bloom[]): Segment[] {
  const cols = blooms
    .map((bloom) => bloom)
    .filter((bloom) => bloom.col >= 0 && bloom.col < row.length)
    .sort((a, b) => a.col - b.col)

  if (cols.length === 0) return [{ text: row }]

  const segments: Segment[] = []
  let at = 0

  for (const bloom of cols) {
    if (bloom.col > at) segments.push({ text: row.slice(at, bloom.col) })
    segments.push({ glyph: bloom.glyph })
    at = bloom.col + 1
  }
  if (at < row.length) segments.push({ text: row.slice(at) })

  return segments
}

/** The blooms on a given row, in the order they appear. */
export function bloomsIn(blooms: Bloom[], row: number): Bloom[] {
  return blooms.filter((bloom) => bloom.row === row)
}
