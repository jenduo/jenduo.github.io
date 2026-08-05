/** Seconds for the desk light to complete one wander. Matches terminal.css. */
export const DRIFT_PERIOD = 55

/**
 * A random negative animation delay, in seconds.
 *
 * The drift itself is a fixed path, aimless enough at this length, but every
 * visitor would arrive at the same moment of it. Starting somewhere random in
 * the cycle means two people never see the same opening frame, and it costs one
 * CSS property rather than a running timer.
 */
export function driftDelay(period = DRIFT_PERIOD, random: () => number = Math.random): string {
  return `-${(random() * period).toFixed(1)}s`
}
