/** Seconds for the desk light to complete one wander. Matches terminal.css. */
export const DRIFT_PERIOD = 13

/**
 * A random negative animation delay, in seconds.
 *
 * The drift itself is a fixed path, aimless enough at this length, but every
 * visitor would arrive at the same moment of it. Starting somewhere random in
 * the cycle means two people never see the same opening frame, and it costs one
 * CSS property rather than a running timer.
 */
export function driftDelay(period = DRIFT_PERIOD, random: () => number = Math.random): string {
  // Truncated, not rounded: rounding a draw near the top of the range up to the
  // period itself would land back at the start of the cycle, which is the one
  // offset meant to be impossible.
  return `-${(Math.floor(random() * period * 10) / 10).toFixed(1)}s`
}
