import { useEffect, useRef, useState } from 'react'
import type { Spotlight } from './glitch'
import { spotlightRows } from './glitch'

/** Reach of the effect, in character columns. */
const RADIUS = 8
/** Re-randomise this often so the noise shimmers rather than sitting still. */
const TICK_MS = 60

/**
 * The ASCII banner. Characters near the pointer scramble and settle as it moves.
 *
 * Hover-only is deliberate rather than a limitation: the art is already
 * desktop-only below 680px, so the interaction and the thing it acts on appear
 * and disappear together, and a touch device never sees an affordance it cannot
 * use.
 */
export function Banner({ rows }: { rows: string[] }) {
  const [shown, setShown] = useState(rows)
  const wrapRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const spot = useRef<Spotlight | null>(null)
  const timer = useRef<number | null>(null)

  function stop() {
    if (timer.current !== null) {
      clearInterval(timer.current)
      timer.current = null
    }
  }

  // Unmounting mid-animation would otherwise leave the interval running.
  useEffect(() => stop, [])

  /**
   * Character cell size, measured from the rendered row rather than assumed.
   * The font is a system stack, so its metrics are not knowable up front.
   */
  function cell(): { width: number; height: number } | null {
    const element = rowRef.current
    const columns = rows[0]?.length ?? 0
    if (!element || columns === 0) return null

    const box = element.getBoundingClientRect()
    if (box.width === 0) return null
    return { width: box.width / columns, height: box.height }
  }

  function onPointerMove(event: React.MouseEvent<HTMLDivElement>) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const wrap = wrapRef.current
    const size = cell()
    if (!wrap || !size) return

    const box = wrap.getBoundingClientRect()
    spot.current = {
      col: (event.clientX - box.left) / size.width - 0.5,
      row: (event.clientY - box.top) / size.height - 0.5,
      radius: RADIUS,
      aspect: size.height / size.width,
    }

    if (timer.current === null) {
      timer.current = window.setInterval(() => {
        setShown(spotlightRows(rows, spot.current, Math.random))
      }, TICK_MS)
    }
  }

  function onPointerLeave() {
    spot.current = null
    stop()
    setShown(rows)
  }

  return (
    <div
      ref={wrapRef}
      className="banner"
      aria-hidden="true"
      onMouseMove={onPointerMove}
      onMouseLeave={onPointerLeave}
    >
      {shown.map((row, index) => (
        <div key={index} ref={index === 0 ? rowRef : undefined} className="line art">
          {row}
        </div>
      ))}
    </div>
  )
}
