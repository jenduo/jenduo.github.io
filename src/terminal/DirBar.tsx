import { entriesOf } from '../commands/nav'
import { displayPath, normalize, resolve } from '../fs/resolve'
import type { Dir } from '../fs/types'

interface Props {
  root: Dir
  cwd: string
  onRun: (command: string) => void
}

/**
 * Glyphs, so the strip reads as a file browser at a glance rather than as
 * another line of output. Stroked rather than filled to match the weight of the
 * surrounding text, and drawn in currentColor so they follow the palette.
 */
function Glyph({ kind }: { kind: 'dir' | 'file' | 'up' }) {
  const paths = {
    dir: 'M2 4.25h4L7.5 6H14v7.75H2z',
    file: 'M4.5 2.5h4L12 6v7.5h-7.5zM8.25 2.5V6H12',
    up: 'M8 13V4M4.5 7.5 8 4l3.5 3.5',
  }

  return (
    <svg className="dirbar-glyph" viewBox="0 0 16 16" aria-hidden="true">
      <path d={paths[kind]} fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

/**
 * What is in the current directory, always on screen and always clickable.
 *
 * Chrome rather than output: this used to be a line printed once at boot, which
 * meant it showed the root forever and scrolled away. It cannot live in the
 * scrollback now that it changes, because the scrollback is a transcript and
 * rewriting history as you navigate would be a lie.
 */
export function DirBar({ root, cwd, onRun }: Props) {
  const here = resolve(root, cwd, '.')
  if (!here || here.kind !== 'dir') return null

  const entries = entriesOf(cwd, here)
  const parent = cwd === '/' ? null : normalize(cwd, '..')

  return (
    <nav className="dirbar" aria-label={`contents of ${cwd}`}>
      <span className="dirbar-path">{displayPath(cwd)}</span>

      {parent !== null ? (
        <button
          type="button"
          className="entry entry-dir dirbar-item"
          onClick={() => onRun(`cd ${parent}`)}
          aria-label="go up one directory"
        >
          <Glyph kind="up" />
          ../
        </button>
      ) : null}

      {entries.map((entry) => (
        <button
          key={entry.path}
          type="button"
          className={`entry entry-${entry.kind} dirbar-item`}
          onClick={() => onRun(`${entry.kind === 'dir' ? 'cd' : 'cat'} ${entry.path}`)}
          aria-label={`${entry.kind === 'dir' ? 'open directory' : 'read file'} ${entry.name}`}
        >
          <Glyph kind={entry.kind} />
          {entry.name}
        </button>
      ))}

      {entries.length === 0 ? <span className="dirbar-empty">empty</span> : null}
    </nav>
  )
}
