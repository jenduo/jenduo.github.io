import { useCallback, useEffect, useRef, useState } from 'react'
import { scrollTopForDrag, thumbGeometry } from './scrollGeometry'

interface Props {
  /** The element being scrolled. */
  target: React.RefObject<HTMLElement | null>
  /** Changes whenever the content might have grown, prompting a re-measure. */
  revision: number
}

/**
 * A scrollbar of our own, because the native one cannot be shaped.
 *
 * Overlay scrollbars ignore `::-webkit-scrollbar` entirely, so their rounded
 * thumb, their width and their position off the frame are all fixed by the OS.
 * Drawing it here is the only way to get a square thumb that fills the column,
 * and it removes the guesswork about where the OS decides to put things.
 */
export function Scrollbar({ target, revision }: Props) {
  const [thumb, setThumb] = useState(() => thumbGeometry(0, 0, 0))
  const trackRef = useRef<HTMLDivElement>(null)

  const measure = useCallback(() => {
    const el = target.current
    if (!el) return
    setThumb(thumbGeometry(el.scrollTop, el.clientHeight, el.scrollHeight))
  }, [target])

  useEffect(() => {
    const el = target.current
    if (!el) return

    measure()
    el.addEventListener('scroll', measure, { passive: true })

    // The window resizes with the viewport and the mobile keyboard, either of
    // which changes how much overflows.
    const observer = new ResizeObserver(measure)
    observer.observe(el)

    return () => {
      el.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [target, measure, revision])

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const el = target.current
    const track = trackRef.current
    if (!el || !track) return

    event.preventDefault()
    const trackHeight = track.getBoundingClientRect().height
    const travel = trackHeight - (trackHeight * thumb.heightPct) / 100
    const overflow = el.scrollHeight - el.clientHeight
    const startY = event.clientY
    const startScrollTop = el.scrollTop

    const onMove = (move: PointerEvent) => {
      el.scrollTop = scrollTopForDrag(startScrollTop, move.clientY - startY, travel, overflow)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div className="scrollbar" ref={trackRef} aria-hidden="true">
      {thumb.visible ? (
        <div
          className="scrollbar-thumb"
          style={{ top: `${thumb.topPct}%`, height: `${thumb.heightPct}%` }}
          onPointerDown={onPointerDown}
        />
      ) : null}
    </div>
  )
}
