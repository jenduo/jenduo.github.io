import type { Line as LineData } from '../commands/types'
import { displayPath } from '../fs/resolve'

interface Props {
  line: LineData
  onRun: (input: string) => void
}

/**
 * Clickable paths are the accessibility story for this site, so they are real
 * buttons: focusable, keyboard-activatable and legible to a screen reader.
 */
export function Line({ line, onRun }: Props) {
  if (line.type === 'prompt') {
    return (
      <div className="line">
        <span className="prompt">{displayPath(line.cwd)}</span>
        <span className="sigil">$</span>
        <span>{line.input}</span>
      </div>
    )
  }

  if (line.type === 'text') {
    return (
      <div
        className={`line tone-${line.tone ?? 'default'}${line.variant ? ` ${line.variant}` : ''}`}
        // Art is decorative; the hero line carries the same words for readers.
        aria-hidden={line.variant === 'art' || undefined}
      >
        {line.text || ' '}
      </div>
    )
  }

  return (
    <div className="line entries">
      {line.entries.map((entry) => (
        <button
          key={entry.path + entry.name}
          type="button"
          className={`entry entry-${entry.kind}`}
          onClick={() => onRun(`${entry.kind === 'dir' ? 'cd' : 'cat'} ${entry.path}`)}
          aria-label={`${entry.kind === 'dir' ? 'open directory' : 'read file'} ${entry.name.trim()}`}
        >
          {entry.name}
          {entry.kind === 'dir' ? '/' : ''}
        </button>
      ))}
    </div>
  )
}
