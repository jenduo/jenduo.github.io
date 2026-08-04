import { cat, open, tree } from './content'
import { colour } from './colour'
import { copy } from './copy'
import { makeHelp } from './help'
import { clear, exit, history, rm, sudo, whoami } from './misc'
import { cd, ls, pwd } from './nav'
import type { CommandResult, CommandSpec, ShellContext } from './types'
import { error, text } from './types'

export const COMMANDS: CommandSpec[] = [
  { name: 'help', usage: 'help', summary: 'show this list', run: makeHelp(() => COMMANDS) },
  { name: 'ls', usage: 'ls [path]', summary: 'list what is here', run: ls },
  { name: 'cd', usage: 'cd [path]', summary: 'change directory', run: cd },
  { name: 'cat', usage: 'cat <file>', summary: 'read a file', run: cat },
  { name: 'tree', usage: 'tree [path]', summary: 'see everything at once', run: tree },
  { name: 'open', usage: 'open <file>', summary: 'open its real link', run: open },
  { name: 'copy', usage: 'copy <file>', summary: 'copy it to the clipboard', run: copy },
  { name: 'pwd', usage: 'pwd', summary: 'where am I', run: pwd },
  { name: 'whoami', usage: 'whoami', summary: 'the short version of me', run: whoami },
  { name: 'history', usage: 'history', summary: 'what I have typed', run: history },
  { name: 'clear', usage: 'clear', summary: 'clear the output', run: clear },
  { name: 'colour', usage: 'colour <name>', summary: 'recolour the terminal', run: colour },
  // Same command under the American spelling, hidden so help lists one name.
  { name: 'color', usage: 'color <name>', summary: '', hidden: true, run: colour },
  { name: 'sudo', usage: 'sudo', summary: '', hidden: true, run: sudo },
  { name: 'rm', usage: 'rm', summary: '', hidden: true, run: rm },
  { name: 'exit', usage: 'exit', summary: '', hidden: true, run: exit },
]

/** Levenshtein distance, for did-you-mean. */
function distance(a: string, b: string): number {
  const rows: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0),
  )
  for (let i = 0; i <= a.length; i++) rows[i][0] = i
  for (let j = 0; j <= b.length; j++) rows[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
  }
  return rows[a.length][b.length]
}

function suggest(input: string): string | null {
  const [best] = COMMANDS.filter((command) => !command.hidden)
    .map((command) => ({ name: command.name, d: distance(input, command.name) }))
    .sort((a, b) => a.d - b.d)
  return best && best.d <= 2 ? best.name : null
}

export function runCommand(input: string, ctx: ShellContext): CommandResult {
  const echoed = { type: 'prompt' as const, cwd: ctx.cwd, input }
  const [name, ...args] = input.trim().split(/\s+/).filter(Boolean)
  if (!name) return { lines: [echoed] }

  const command = COMMANDS.find((entry) => entry.name === name)
  if (!command) {
    const near = suggest(name)
    return {
      lines: [
        echoed,
        error(`jsh: command not found: ${name}`),
        near ? text(`did you mean '${near}'?`, 'dim') : text("type 'help' for a list", 'dim'),
      ],
    }
  }

  const result = command.run(args, ctx)
  return { ...result, lines: [echoed, ...result.lines] }
}
