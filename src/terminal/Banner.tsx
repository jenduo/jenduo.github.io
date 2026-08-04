import { useEffect, useRef, useState } from 'react'
import { pulseRadius, spotlightRows } from './glitch'

/**
 * Reach of the effect in character columns. The banner is 67 columns wide, so a
 * peak past that guarantees the wave covers the whole thing wherever the pointer
 * happens to be.
 */
const RADIUS_FROM = 2
const RADIUS_TO = 75
/** Grow, then collapse, then round again: about 3s per breath at the tick below. */
const GROW_TICKS = 30
const COLLAPSE_TICKS = 20
/**
 * Re-randomise this often so the noise shimmers rather than sitting still.
 * Slowing the breath means more ticks, not a longer tick: raising this instead
 * would make the noise itself flicker chunkily.
 */
const TICK_MS = 60

interface Pointer {
  col: number
  row: number
  aspect: number
}

/**
 * The ASCII banner. Characters near the pointer scramble and settle as it moves,
 * and the affected radius opens up the longer the pointer rests on the banner.
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
  const pointer = useRef<Pointer | null>(null)
  const timer = useRef<number | null>(null)
  /** Ticks since the pointer arrived, driving the radius outwards. */
  const ticks = useRef(0)

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
    pointer.current = {
      col: (event.clientX - box.left) / size.width - 0.5,
      row: (event.clientY - box.top) / size.height - 0.5,
      aspect: size.height / size.width,
    }

    if (timer.current === null) {
      // The pulse is tracked in ticks rather than restarted on every move, so
      // sweeping the pointer around does not keep resetting the breath.
      ticks.current = 0
      timer.current = window.setInterval(() => {
        const at = pointer.current
        if (!at) return

        ticks.current += 1
        const radius = pulseRadius(
          ticks.current,
          RADIUS_FROM,
          RADIUS_TO,
          GROW_TICKS,
          COLLAPSE_TICKS,
        )
        setShown(spotlightRows(rows, { ...at, radius }, Math.random))
      }, TICK_MS)
    }
  }

  function onPointerLeave() {
    pointer.current = null
    ticks.current = 0
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
