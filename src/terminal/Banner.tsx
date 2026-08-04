import { useEffect, useRef, useState } from 'react'
import { glitchIntensity, glitchRows } from './glitch'

const FRAMES = 14
const FRAME_MS = 45

/**
 * The ASCII banner, which scrambles and resolves on hover.
 *
 * Hover-only is deliberate rather than a limitation: the art is already
 * desktop-only below 680px, so the interaction and the thing it acts on appear
 * and disappear together. Touch devices never see a hover affordance they
 * cannot use.
 */
export function Banner({ rows }: { rows: string[] }) {
  const [shown, setShown] = useState(rows)
  const timer = useRef<number | null>(null)

  function stop() {
    if (timer.current !== null) {
      clearInterval(timer.current)
      timer.current = null
    }
  }

  // Unmounting mid-animation would otherwise leave the interval running.
  useEffect(() => stop, [])

  function play() {
    if (timer.current !== null) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    timer.current = window.setInterval(() => {
      frame += 1
      const intensity = glitchIntensity(frame, FRAMES)

      // Intensity hits zero on the last frame, so settling back to the real art
      // is the natural end of the animation rather than a separate restore.
      if (intensity <= 0) {
        setShown(rows)
        stop()
        return
      }

      setShown(glitchRows(rows, intensity, Math.random))
    }, FRAME_MS)
  }

  return (
    <div className="banner" aria-hidden="true" onMouseEnter={play}>
      {shown.map((row, index) => (
        <div key={index} className="line art">
          {row}
        </div>
      ))}
    </div>
  )
}
