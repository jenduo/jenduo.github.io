import { useEffect, useRef, useState } from 'react'
import { displayPath } from '../fs/resolve'
import { complete } from './complete'
import { SUGGESTIONS } from './ghost'
import { Line } from './Line'
import { TitleBar } from './TitleBar'
import { useGhostTyping } from './useGhostTyping'
import { useShell } from './useShell'

const CHIPS = ['help', 'ls', 'tree', 'cat about.txt', 'cd projects', 'cat contact.txt']

/** How long a visitor can sit still before the shell offers a suggestion. */
const IDLE_MS = 4000

export function Terminal() {
  const { cwd, lines, history, submit, root } = useShell()
  const [input, setInput] = useState('')
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // Once someone has interacted they have understood the prompt, so the
  // suggestion retires for good rather than reappearing mid-thought.
  const [engaged, setEngaged] = useState(false)
  const [idle, setIdle] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setIdle(true), IDLE_MS)
    return () => clearTimeout(id)
  }, [])

  const ghost = useGhostTyping(idle && !engaged && input === '', SUGGESTIONS)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [lines])

  function run(command: string) {
    setEngaged(true)
    submit(command)
    setInput('')
    setHistoryIndex(null)
    inputRef.current?.focus()
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
        setEngaged(true)
        setInput(completed)
      }

      // Nothing to accept and nothing to complete, so let Tab do its normal job
      // and move focus. Swallowing it unconditionally traps keyboard-only
      // visitors in the input with no way out.
      return
    }

    setEngaged(true)

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
    inputRef.current?.focus()
  }

  return (
    <div className="window">
      <TitleBar cwd={cwd} />

      <main className="terminal">
        <div className="scanlines" aria-hidden="true" />

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
            {ghost.shown ? <span className="ghost-hint">tab to run</span> : null}
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
