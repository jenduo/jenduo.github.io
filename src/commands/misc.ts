import type { Command } from './types'
import { error, ok, text } from './types'

export const clear: Command = () => ({ lines: [], clear: true })

export const whoami: Command = () => ok(text('visitor'))

export const history: Command = (_args, ctx) =>
  ctx.history.length === 0
    ? ok(text('no history yet', 'dim'))
    : { lines: ctx.history.map((entry, i) => text(`${String(i + 1).padStart(4)}  ${entry}`)) }

export const sudo: Command = () =>
  ok(error('visitor is not in the sudoers file. This incident has been reported.'))

export const rm: Command = (args) =>
  args.join(' ').includes('-rf')
    ? ok(text('nice try. this filesystem is made of hopes and TypeScript.', 'accent'))
    : ok(error('rm: read-only filesystem'))

export const exit: Command = () =>
  ok(text("there is no exit. try 'cat contact.txt' instead.", 'dim'))
