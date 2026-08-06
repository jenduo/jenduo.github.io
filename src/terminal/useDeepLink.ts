import { useEffect, useRef } from 'react'
import { resolve } from '../fs/resolve'
import type { Dir } from '../fs/types'
import { commandFor, hashFor, pathFromHash } from './route'

/**
 * Keeps the URL and the shell pointing at the same place.
 *
 * Writing the hash creates a history entry, so the back button walks the visit
 * rather than leaving the site. The two directions guard against each other by
 * comparing the hash they want with the hash that is there, which is what stops
 * the write and the read from chasing each other in a loop.
 */
export function useDeepLink(
  root: Dir,
  here: string,
  submit: (input: string) => void,
): void {
  const wanted = hashFor(here)

  // Read: on arrival, and whenever the hash changes under us, which is what the
  // back and forward buttons do.
  const submitRef = useRef(submit)
  submitRef.current = submit
  const hereRef = useRef(here)
  hereRef.current = here

  useEffect(() => {
    const apply = () => {
      const path = pathFromHash(window.location.hash)
      if (path === null || path === hereRef.current) return
      const node = resolve(root, '/', path)
      // A stale or hand-edited link is left alone rather than answered with an
      // error a visitor did not ask for.
      if (!node) return
      submitRef.current(commandFor(path, node.kind))
    }

    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [root])

  // Write: follow the shell.
  useEffect(() => {
    if (window.location.hash === wanted) return
    if (wanted === '') {
      // Assigning '' would leave a bare '#' in the address bar.
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      return
    }
    window.location.hash = wanted
  }, [wanted])
}
