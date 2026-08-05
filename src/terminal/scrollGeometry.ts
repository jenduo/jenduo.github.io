export interface Thumb {
  /** False when everything fits and there is nothing to scroll. */
  visible: boolean
  /** Distance from the top of the track, as a percentage of track height. */
  topPct: number
  /** Height as a percentage of track height. */
  heightPct: number
}

const HIDDEN: Thumb = { visible: false, topPct: 0, heightPct: 0 }

/**
 * Floor on the thumb's height, as a percentage of the track.
 *
 * Proportional sizing alone makes the thumb vanish once the scrollback grows
 * long, leaving nothing to grab.
 */
const MIN_HEIGHT_PCT = 7

/**
 * Where the thumb sits and how big it is.
 *
 * Pure, so the arithmetic that actually goes wrong, the off-by-one at the
 * extremes and the divide-by-zero when nothing overflows, is testable without a
 * browser. The component only turns this into two percentages.
 */
export function thumbGeometry(scrollTop: number, clientHeight: number, scrollHeight: number): Thumb {
  const overflow = scrollHeight - clientHeight
  if (overflow <= 0 || clientHeight <= 0) return HIDDEN

  const heightPct = Math.max(MIN_HEIGHT_PCT, Math.min(100, (clientHeight / scrollHeight) * 100))
  const progress = Math.min(1, Math.max(0, scrollTop / overflow))

  // Travel is what is left of the track once the thumb's own height is taken
  // out, so at the bottom its lower edge lands exactly on the track's.
  return { visible: true, topPct: progress * (100 - heightPct), heightPct }
}

/**
 * The scrollTop a drag should produce.
 *
 * `travel` is the track height minus the thumb height: the distance the thumb
 * can actually move. Dividing by the full track height instead would make the
 * content lag behind the pointer.
 */
export function scrollTopForDrag(
  startScrollTop: number,
  deltaY: number,
  travel: number,
  overflow: number,
): number {
  if (travel <= 0 || overflow <= 0) return startScrollTop
  return Math.min(overflow, Math.max(0, startScrollTop + (deltaY / travel) * overflow))
}
