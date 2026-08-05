import { describe, expect, it } from 'vitest'
import { scrollTopForDrag, thumbGeometry } from './scrollGeometry'

describe('thumbGeometry', () => {
  it('hides when the content fits', () => {
    expect(thumbGeometry(0, 500, 500).visible).toBe(false)
    expect(thumbGeometry(0, 500, 400).visible).toBe(false)
  })

  it('hides when the element has no height yet', () => {
    expect(thumbGeometry(0, 0, 1000).visible).toBe(false)
  })

  it('sizes in proportion to how much is visible', () => {
    expect(thumbGeometry(0, 250, 1000).heightPct).toBeCloseTo(25)
  })

  it('sits at the top when unscrolled', () => {
    expect(thumbGeometry(0, 250, 1000).topPct).toBe(0)
  })

  // The lower edge must land on the track's, not overshoot it.
  it('ends flush with the bottom when scrolled all the way', () => {
    const { topPct, heightPct } = thumbGeometry(750, 250, 1000)
    expect(topPct + heightPct).toBeCloseTo(100)
  })

  it('sits halfway at half scroll', () => {
    const { topPct, heightPct } = thumbGeometry(375, 250, 1000)
    expect(topPct).toBeCloseTo((100 - heightPct) / 2)
  })

  // Otherwise a very long scrollback leaves nothing to grab.
  it('never shrinks below the minimum height', () => {
    expect(thumbGeometry(0, 10, 100000).heightPct).toBeGreaterThanOrEqual(7)
  })

  it('clamps a scrollTop past either end', () => {
    expect(thumbGeometry(-50, 250, 1000).topPct).toBe(0)
    const { topPct, heightPct } = thumbGeometry(99999, 250, 1000)
    expect(topPct + heightPct).toBeCloseTo(100)
  })
})

describe('scrollTopForDrag', () => {
  it('maps a drag onto the scrollable range', () => {
    // Half the travel should move half the overflow.
    expect(scrollTopForDrag(0, 50, 100, 800)).toBe(400)
  })

  it('follows the pointer upwards too', () => {
    expect(scrollTopForDrag(400, -50, 100, 800)).toBe(0)
  })

  it('clamps at both ends', () => {
    expect(scrollTopForDrag(0, -999, 100, 800)).toBe(0)
    expect(scrollTopForDrag(0, 9999, 100, 800)).toBe(800)
  })

  it('does nothing when there is no travel or no overflow', () => {
    expect(scrollTopForDrag(120, 50, 0, 800)).toBe(120)
    expect(scrollTopForDrag(120, 50, 100, 0)).toBe(120)
  })
})
