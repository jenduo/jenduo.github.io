/**
 * An image drawn on the character grid.
 *
 * The art is a fixed number of columns and cannot reflow, so it can only be
 * scaled. The column count is published as a custom property and the stylesheet
 * sizes the font from it, which means art of any width fits the container
 * without the CSS having to know how wide any particular picture is.
 */
export function Photo({ rows }: { rows: string[] }) {
  const columns = rows.reduce((widest, row) => Math.max(widest, row.length), 1)

  return (
    <div
      className="photo"
      style={{ '--photo-columns': columns } as React.CSSProperties}
      aria-hidden="true"
    >
      {rows.map((row, index) => (
        <div key={index} className="photo-row">
          {row || ' '}
        </div>
      ))}
    </div>
  )
}
