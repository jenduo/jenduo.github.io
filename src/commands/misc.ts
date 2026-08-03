import type { Command, Line } from './types'
import { art, error, ok, text } from './types'

export const clear: Command = () => ({ lines: [], clear: true })

export const whoami: Command = () => ok(text('visitor'))

export const echo: Command = (args) => ok(text(args.join(' ')))

export const history: Command = (_args, ctx) =>
  ctx.history.length === 0
    ? ok(text('no history yet', 'dim'))
    : { lines: ctx.history.map((entry, i) => text(`${String(i + 1).padStart(4)}  ${entry}`)) }

export const date: Command = () => ok(text(new Date().toString()))

// Pure ASCII on purpose: block-drawing characters are not reliably
// single-width across system monospace fonts, so they shear apart.
const LOGO = [
  '     _ ____  ',
  '    | |  _ \\ ',
  ' _  | | | | |',
  '| |_| | |_| |',
  ' \\___/|____/ ',
]

export const neofetch: Command = (_args, ctx) => {
  const facts: [string, string][] = [
    ['visitor', '@ jenduo.github.io'],
    ['───────', '──────────────────'],
    ['shell', 'jsh 1.0'],
    ['role', 'software engineer'],
    ['stack', 'TypeScript · React · Python'],
    ['cwd', ctx.cwd],
    ['next', 'cat contact.txt'],
  ]

  const lines: Line[] = []
  for (let i = 0; i < Math.max(LOGO.length, facts.length); i++) {
    const logo = (LOGO[i] ?? '').padEnd(13)
    const fact = facts[i]
    lines.push(art(`${logo}   ${fact ? fact[0].padEnd(9) + fact[1] : ''}`))
  }
  return { lines }
}

export const sudo: Command = () =>
  ok(error('visitor is not in the sudoers file. This incident has been reported.'))

export const rm: Command = (args) =>
  args.join(' ').includes('-rf')
    ? ok(text('nice try. this filesystem is made of hopes and TypeScript.', 'accent'))
    : ok(error('rm: read-only filesystem'))

export const exit: Command = () =>
  ok(text("there is no exit. try 'cat contact.txt' instead.", 'dim'))
