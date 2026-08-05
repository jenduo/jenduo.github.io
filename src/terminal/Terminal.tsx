import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { displayPath, resolve } from '../fs/resolve'
import { complete } from './complete'
import { suggestionsFor } from './ghost'
import { DirBar } from './DirBar'
import { Line } from './Line'
import { TitleBar } from './TitleBar'
import { useGhostTyping } from './useGhostTyping'
import { useShell } from './useShell'
import { useViewportHeight } from './useViewportHeight'

const CHIPS = ['whoami', 'ls', 'tree', 'cat skills', 'ls experience', 'ls contact']

/** How long a visitor can sit still before the shell offers a suggestion. */
const IDLE_MS = 1200

export function Terminal() {
  const { cwd, lines, history, submit, root } = useShell()
  const [input, setInput] = useState('')
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // Typing dismisses the suggestion, but only until the next directory change:
  // a new directory has different things worth trying, so it is worth offering
  // again rather than retiring for the whole visit.
  const [dismissed, setDismissed] = useState(false)
  const [idle, setIdle] = useState(false)

  useEffect(() => {
    setDismissed(false)
    setIdle(false)
    const id = setTimeout(() => setIdle(true), IDLE_MS)
    return () => clearTimeout(id)
  }, [cwd])

  const suggestions = useMemo(() => {
    const here = resolve(root, cwd, '.')
    return suggestionsFor(here && here.kind === 'dir' ? here : null, cwd)
  }, [root, cwd])

  const ghost = useGhostTyping(idle && !dismissed && input === '', suggestions)

  const scrollToPrompt = useCallback(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [])

  useEffect(scrollToPrompt, [lines, scrollToPrompt])

  // Sizes the shell to the visible area, so an open keyboard shrinks the
  // terminal instead of covering the prompt.
  useViewportHeight(scrollToPrompt)

  /**
   * Touch devices open a keyboard whenever an input takes focus, so tapping a
   * filename or the run button would summon one unasked. Only a device with a
   * real pointer gets the caret handed back.
   */
  function refocusIfPointer() {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      inputRef.current?.focus()
    }
  }

  function run(command: string) {
    setDismissed(true)
    submit(command)
    setInput('')
    setHistoryIndex(null)
    refocusIfPointer()
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Tab') {
      // Accept the idle suggestion. It only ever shows on an empty input, so
      // this cannot shadow completion. Runs the complete command, never the
      // half-typed frame currently on screen.
      if (ghost.full) {
        event.preventDefault()
        run(ghost.full)
        return
      }

      const completed = complete(input, root, cwd)
      if (completed !== input) {
        event.preventDefault()
        setDismissed(true)
        setInput(completed)
      }

      // Nothing to accept and nothing to complete, so let Tab do its normal job
      // and move focus. Swallowing it unconditionally traps keyboard-only
      // visitors in the input with no way out.
      return
    }

    setDismissed(true)

    if (event.key === 'Enter') {
      run(input)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (history.length === 0) return
      const next = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(next)
      setInput(history[next])
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (historyIndex === null) return
      const next = historyIndex + 1
      if (next >= history.length) {
        setHistoryIndex(null)
        setInput('')
        return
      }
      setHistoryIndex(next)
      setInput(history[next])
    }
  }

  /** Clicking anywhere in the shell puts the caret back, unless the visitor is
      mid-selection, in which case stealing focus would fight a copy. */
  function focusInput() {
    if (window.getSelection()?.toString()) return
    refocusIfPointer()
  }

  return (
    <div className="window">
      <TitleBar cwd={cwd} />

      <main className="terminal">
        <div className="scanlines" aria-hidden="true" />

        <DirBar root={root} cwd={cwd} onRun={run} />

        {/* The input line lives inside the scroll flow so the prompt always sits
            directly under the last line of output, like a real terminal. */}
        <div className="scrollback" role="log" aria-live="polite" onClick={focusInput}>
          {lines.map((line, index) => (
            <Line key={index} line={line} onRun={run} />
          ))}

          <div className="inputline">
            <label className="prompt" htmlFor="jsh-input">
              {displayPath(cwd)}
            </label>
            <span className="sigil">$</span>
            <input
              id="jsh-input"
              ref={inputRef}
              className="input"
              value={input}
              placeholder={ghost.shown}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="terminal input"
              autoFocus
            />
            {/* Touch keyboards have no Tab key, so mobile gets a tap target
                instead of a keycap naming a key that does not exist. CSS shows
                exactly one of these. */}
            {ghost.shown ? (
              <>
                <kbd className="ghost-hint">tab</kbd>
                <button
                  type="button"
                  className="ghost-run"
                  onClick={() => run(ghost.full)}
                  aria-label={`run ${ghost.full}`}
                >
                  run &#9656;
                </button>
              </>
            ) : null}
          </div>

          <div ref={endRef} />
        </div>

        <div className="chips" aria-label="example commands">
          {CHIPS.map((chip) => (
            <button key={chip} type="button" className="chip" onClick={() => run(chip)}>
              {chip}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
