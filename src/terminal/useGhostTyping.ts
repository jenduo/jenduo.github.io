import { useEffect, useMemo, useState } from 'react'
import type { GhostFrame } from './ghost'
import { ghostFrames } from './ghost'

const TICK_MS = 70
const NONE: GhostFrame = { shown: '', full: '' }

function usePrefersReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/**
 * The ghost suggestion to show, or a blank frame for none.
 *
 * Under reduced motion the first suggestion is shown complete and static: the
 * point is to tell a visitor what to type, and that survives without motion.
 */
export function useGhostTyping(active: boolean, suggestions: string[]): GhostFrame {
  const reduced = usePrefersReducedMotion()
  const frames = useMemo(() => ghostFrames(suggestions), [suggestions])
  const [index, setIndex] = useState(0)

  const animating = active && !reduced && frames.length > 0

  useEffect(() => {
    if (!animating) return

    // Restart at the first suggestion every time this arms or the suggestion set
    // changes. Without this the index carries over, so walking into a directory
    // resumed the cycle wherever it happened to be and the last suggestion could
    // appear first. Depends on `frames`, not `frames.length`: a different set of
    // the same size still needs to restart.
    setIndex(0)

    const id = setInterval(() => setIndex((n) => (n + 1) % frames.length), TICK_MS)
    return () => clearInterval(id)
  }, [animating, frames])

  if (!active) return NONE
  if (reduced) {
    const [first] = suggestions
    return first ? { shown: first, full: first } : NONE
  }
  return frames[index] ?? NONE
}
