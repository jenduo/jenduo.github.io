import type { Line } from '../commands/types'
import { text } from '../commands/types'

/**
 * Turns a file body into lines, giving `# ` headings real emphasis.
 *
 * Content is authored as plain strings because that keeps it readable and
 * editable in one place. The cost was that `# InvestorHub` printed with the hash
 * still attached and no weight to it, so this is the one piece of markup worth
 * understanding. Everything else is passed through untouched.
 */
export function formatBody(body: string): Line[] {
  return body.split('\n').map((line) => {
    const heading = line.match(/^#\s+(.*)$/)
    return heading ? { type: 'text', text: heading[1], variant: 'heading' } : text(line)
  })
}
