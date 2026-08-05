import { entriesOf } from '../commands/nav'
import { normalize, resolve } from '../fs/resolve'
import type { Dir } from '../fs/types'

interface Props {
  root: Dir
  cwd: string
  onRun: (command: string) => void
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
      {parent !== null ? (
        <button
          type="button"
          className="entry entry-dir"
          onClick={() => onRun(`cd ${parent}`)}
          aria-label="go up one directory"
        >
          ../
        </button>
      ) : null}

      {entries.map((entry) => (
        <button
          key={entry.path}
          type="button"
          className={`entry entry-${entry.kind}`}
          onClick={() => onRun(`${entry.kind === 'dir' ? 'cd' : 'cat'} ${entry.path}`)}
          aria-label={`${entry.kind === 'dir' ? 'open directory' : 'read file'} ${entry.name}`}
        >
          {entry.name}
          {entry.kind === 'dir' ? '/' : ''}
        </button>
      ))}

      {entries.length === 0 ? <span className="dirbar-empty">empty</span> : null}
    </nav>
  )
}
