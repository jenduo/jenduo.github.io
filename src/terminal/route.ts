/**
 * The URL as a shareable position in the filesystem.
 *
 * Without this the address bar never changes, so there is no way to send someone
 * an entry: they get the front door and a description of what to type. The hash
 * carries the path, which also means no server rewrites and no 404s, and the
 * browser's back button walks the visit.
 */

/** The hash for a location. Home is no hash at all, not `#/`. */
export function hashFor(path: string): string {
  return path === '/' ? '' : `#${path}`
}

/**
 * The path a hash points at, or null when it points nowhere.
 *
 * Anything that is not a rooted path is ignored rather than guessed at: a bare
 * `#top` is somebody else's anchor, not one of ours.
 */
export function pathFromHash(hash: string): string | null {
  if (!hash.startsWith('#/')) return null
  const path = hash.slice(1).replace(/\/+$/, '')
  return path === '' ? '/' : path
}

/** The command that puts a visitor at a path, given what is there. */
export function commandFor(path: string, kind: 'dir' | 'file'): string {
  return kind === 'dir' ? `cd ${path}` : `cat ${path}`
}
