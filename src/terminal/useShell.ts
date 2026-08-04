import { useCallback, useRef, useState } from 'react'
import { runCommand } from '../commands/index'
import type { Line } from '../commands/types'
import { error } from '../commands/types'
import { root } from '../fs/tree'
import { BOOT } from './boot'
import { nextLines } from './scrollback'

interface ShellState {
  cwd: string
  lines: Line[]
  history: string[]
}

const INITIAL: ShellState = { cwd: '/', lines: BOOT, history: [] }

export function useShell() {
  // The ref is the authority and is updated synchronously, so two commands
  // submitted in the same tick cannot resolve against a stale directory.
  const stateRef = useRef<ShellState>(INITIAL)
  const [state, setState] = useState<ShellState>(INITIAL)

  /** Adds lines after the fact, for results that only arrive asynchronously. */
  const append = useCallback((extra: Line[]) => {
    const next = { ...stateRef.current, lines: [...stateRef.current.lines, ...extra] }
    stateRef.current = next
    setState(next)
  }, [])

  const submit = useCallback((input: string) => {
    const current = stateRef.current
    const result = runCommand(input, { root, cwd: current.cwd, history: current.history })

    // Side effects belong here in the event handler, not in a state updater.
    if (result.openUrl) window.open(result.openUrl, '_blank', 'noopener,noreferrer')
    // The palette lives in CSS; this only flips which block applies.
    if (result.theme) document.documentElement.dataset.theme = result.theme

    // Reported rather than assumed: a blocked clipboard would otherwise leave a
    // 'copied' line on screen that never happened.
    if (result.copy !== undefined) {
      navigator.clipboard
        ?.writeText(result.copy)
        .catch(() => append([error('copy: the browser refused clipboard access')]))
    }

    const next: ShellState = {
      cwd: result.cwd ?? current.cwd,
      lines: nextLines(current.lines, result, BOOT),
      history: input.trim() ? [...current.history, input] : current.history,
    }
    stateRef.current = next
    setState(next)
  }, [])

  return { ...state, submit, root }
}
