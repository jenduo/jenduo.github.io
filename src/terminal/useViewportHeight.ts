import { useEffect } from 'react'

/**
 * Publishes the *visual* viewport height as `--app-height`.
 *
 * `height: 100%` and even `100dvh` measure the layout viewport, which does not
 * shrink when a mobile keyboard opens, so the prompt ends up hidden behind it.
 * `window.visualViewport` is the only thing that reports the actually visible
 * area, so the shell sizes itself from that instead.
 *
 * `onResize` fires after each change so the caller can keep the prompt in view.
 */
export function useViewportHeight(onResize?: () => void): void {
  useEffect(() => {
    const viewport = window.visualViewport

    const apply = () => {
      const height = viewport ? viewport.height : window.innerHeight
      document.documentElement.style.setProperty('--app-height', `${height}px`)
      onResize?.()
    }

    apply()

    // `scroll` matters too: iOS shifts the visual viewport rather than resizing
    // it when the keyboard opens near the bottom of the page.
    viewport?.addEventListener('resize', apply)
    viewport?.addEventListener('scroll', apply)
    window.addEventListener('resize', apply)

    return () => {
      viewport?.removeEventListener('resize', apply)
      viewport?.removeEventListener('scroll', apply)
      window.removeEventListener('resize', apply)
    }
  }, [onResize])
}
