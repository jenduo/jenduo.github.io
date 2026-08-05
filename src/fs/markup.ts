import type { Line } from '../commands/types'

/**
 * Turns a file body into lines.
 *
 * Bodies are authored unwrapped and unindented: one long line per paragraph or
 * bullet, with no leading spaces. Wrapping and indentation are the stylesheet's
 * job, which is what lets text fill the window and lets a wrapped bullet align
 * under its own text instead of resetting to column zero. Hard-wrapping the
 * source, as this used to, fixed the measure at whatever width was guessed.
 *
 * Two pieces of markup, both only at the start of a line:
 *
 *   # title       becomes the title card
 *   ## subtitle   attaches to the title above it, in the same card
 *
 * A `##` with no `#` before it stays plain text rather than silently producing a
 * card with no title. A `- ` prefix marks a bullet.
 */
export function formatBody(body: string): Line[] {
  const lines: Line[] = []
  const rows = body.split('\n')

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    const title = row.match(/^#\s+(.*)$/)
    if (title) {
      const next = rows[i + 1]?.match(/^##\s+(.*)$/)
      if (next) i += 1
      lines.push({ type: 'titlecard', title: title[1], subtitle: next?.[1] })
      continue
    }

    const bullet = row.match(/^-\s+(.*)$/)
    lines.push(
      bullet
        ? { type: 'text', text: bullet[1], variant: 'bullet' }
        : { type: 'text', text: row, variant: 'body' },
    )
  }

  return lines
}
