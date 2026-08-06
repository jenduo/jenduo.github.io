import { useCallback, useRef, useState } from 'react'
import { runCommand } from '../commands/index'
import type { Line } from '../commands/types'
import { root } from '../fs/tree'
import { BOOT } from './boot'
import { nextLines } from './scrollback'

interface ShellState {
  cwd: string
  /** The file on screen, if the last command was about one. Drives the URL. */
  focus?: string
  lines: Line[]
  history: string[]
}

const INITIAL: ShellState = { cwd: '/', lines: BOOT, history: [] }

export function useShell() {
  // The ref is the authority and is updated synchronously, so two commands
  // submitted in the same tick cannot resolve against a stale directory.
  const stateRef = useRef<ShellState>(INITIAL)
  const [state, setState] = useState<ShellState>(INITIAL)

  const submit = useCallback((input: string) => {
    const current = stateRef.current
    const result = runCommand(input, { root, cwd: current.cwd, history: current.history })

    // Side effects belong here in the event handler, not in a state updater.
    if (result.openUrl) window.open(result.openUrl, '_blank', 'noopener,noreferrer')
    // The palette lives in CSS; this only flips which block applies.
    if (result.theme) document.documentElement.dataset.theme = result.theme

    const next: ShellState = {
      cwd: result.cwd ?? current.cwd,
      // Deliberately not carried forward: once you run anything else, the URL
      // goes back to naming where you are standing.
      focus: result.focus,
      lines: nextLines(current.lines, result, BOOT),
      history: input.trim() ? [...current.history, input] : current.history,
    }
    stateRef.current = next
    setState(next)
  }, [])

  /**
   * Ctrl+L. Wipes the scrollback without echoing a command, which is what
   * separates the keystroke from typing `clear`.
   */
  const clearScreen = useCallback(() => {
    const next = { ...stateRef.current, lines: BOOT }
    stateRef.current = next
    setState(next)
  }, [])

  /**
   * Ctrl+C. Leaves the abandoned line on screen marked `^C` and drops it, so the
   * transcript shows what was given up on. Nothing runs, and nothing is recorded
   * in history: a line you cancelled is not a line you ran.
   */
  const abandon = useCallback((input: string) => {
    const current = stateRef.current
    const next = {
      ...current,
      lines: [...current.lines, { type: 'prompt' as const, cwd: current.cwd, input: `${input}^C` }],
    }
    stateRef.current = next
    setState(next)
  }, [])

  return { ...state, submit, clearScreen, abandon, root }
}
