import { displayPath } from '../fs/resolve'

/**
 * Decorative window chrome, desktop only.
 *
 * The controls are spans, not buttons, and the whole strip is hidden from
 * assistive tech: it should look like a terminal window without pretending to
 * be one. A focusable "close" that does nothing is worse than no close at all.
 */
export function TitleBar({ cwd }: { cwd: string }) {
  return (
    <div className="titlebar" aria-hidden="true">
      <div className="tab">
        <span className="tab-icon">&gt;_</span>
        <span className="tab-label">jennifer@duong:{displayPath(cwd)}$</span>
      </div>

      <div className="controls">
        <span className="ctl">&#9472;</span>
        <span className="ctl">&#9723;</span>
        <span className="ctl ctl-close">&#10005;</span>
      </div>
    </div>
  )
}
