import { Banner } from './Banner'
import { Portrait } from './Portrait'
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

  if (line.type === 'banner') {
    return <Banner rows={line.rows} />
  }

  if (line.type === 'portrait') {
    return <Portrait src={line.src} alt={line.alt} />
  }

  if (line.type === 'text') {
    return (
      <div className={`line tone-${line.tone ?? 'default'}${line.variant ? ` ${line.variant}` : ''}`}>
        {line.text || ' '}
      </div>
    )
  }

  if (line.type === 'icons') {
    return (
      <div className="line icons">
        <span className="icons-label">{line.label}</span>
        {line.items.map((item) => (
          <span className="icons-item" key={item.name}>
            {item.path ? (
              // Decorative: the name sits right beside it, so announcing the
              // logo as well would just repeat the word.
              <svg className="icons-glyph" viewBox="0 0 24 24" aria-hidden="true">
                <path d={item.path} />
              </svg>
            ) : null}
            {item.name}
          </span>
        ))}
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
