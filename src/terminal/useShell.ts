import { useCallback, useRef, useState } from 'react'
import { runCommand } from '../commands/index'
import type { Line } from '../commands/types'
import { root } from '../fs/tree'
import { BOOT } from './boot'

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

  const submit = useCallback((input: string) => {
    const current = stateRef.current
    const result = runCommand(input, { root, cwd: current.cwd, history: current.history })

    // Side effects belong here in the event handler, not in a state updater.
    if (result.openUrl) window.open(result.openUrl, '_blank', 'noopener,noreferrer')

    const next: ShellState = {
      cwd: result.cwd ?? current.cwd,
      lines: result.clear ? [] : [...current.lines, ...result.lines],
      history: input.trim() ? [...current.history, input] : current.history,
    }
    stateRef.current = next
    setState(next)
  }, [])

  return { ...state, submit, root }
}
