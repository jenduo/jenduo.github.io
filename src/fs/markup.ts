import type { Line } from '../commands/types'
import { text } from '../commands/types'

/**
 * Turns a file body into lines, giving its title a framed card.
 *
 * Content is authored as plain strings because that keeps it readable and
 * editable in one place. Two pieces of markup are understood, both only at the
 * start of a line:
 *
 *   # title       becomes the card's title
 *   ## subtitle   attaches to the title above it, in the same card
 *
 * A `##` on its own, with no `#` before it, is left as ordinary text rather than
 * silently producing a card with no title.
 */
export function formatBody(body: string): Line[] {
  const lines: Line[] = []
  const rows = body.split('\n')

  for (let i = 0; i < rows.length; i++) {
    const title = rows[i].match(/^#\s+(.*)$/)
    if (!title) {
      lines.push(text(rows[i]))
      continue
    }

    const next = rows[i + 1]?.match(/^##\s+(.*)$/)
    if (next) i += 1

    lines.push({ type: 'titlecard', title: title[1], subtitle: next?.[1] })
  }

  return lines
}
