import type { Line } from '../commands/types'
import { asHint } from '../commands/types'

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
 * card with no title. A `- ` prefix marks a bullet, and a line of the form
 * `type 'cmd' ...` becomes a hint with the command clickable.
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

      // The card carries its own space beneath it, so a blank line written after
      // one in the source would double the gap. Bodies are still authored with
      // that blank, because a title butted against its text is hard to read.
      if (rows[i + 1] === '') i += 1
      continue
    }

    const hint = asHint(row)
    if (hint) {
      // Indented like the prose around it. The boot screen's hint is not.
      lines.push({ ...hint, variant: 'body' })
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
