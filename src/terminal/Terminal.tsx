import { useEffect, useRef, useState } from 'react'
import { displayPath } from '../fs/resolve'
import { complete } from './complete'
import { Line } from './Line'
import { useShell } from './useShell'

const CHIPS = ['help', 'ls', 'cat about.txt', 'cd projects', 'tree', 'neofetch']

export function Terminal() {
  const { cwd, lines, history, submit, root } = useShell()
  const [input, setInput] = useState('')
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [lines])

  function run(command: string) {
    submit(command)
    setInput('')
    setHistoryIndex(null)
    inputRef.current?.focus()
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      run(input)
      return
    }

    if (event.key === 'Tab') {
      event.preventDefault()
      setInput((current) => complete(current, root, cwd))
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

  /** Clicking anywhere in the shell puts the caret back — unless the visitor is
      mid-selection, in which case stealing focus would fight a copy. */
  function focusInput() {
    if (window.getSelection()?.toString()) return
    inputRef.current?.focus()
  }

  return (
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
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="terminal input"
            autoFocus
          />
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
  )
}
