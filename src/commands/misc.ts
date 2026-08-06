import { intro, portrait } from '../fs/tree'
import type { Command } from './types'
import { error, ok, text } from './types'

export const clear: Command = () => ({ lines: [], clear: true })

/** The photo and intro both live in fs/tree.ts with the rest of the content. */
export const whoami: Command = () => ({
  lines: [
    { type: 'portrait', src: portrait.src, alt: portrait.alt },
    text(''),
    ...intro.split('\n').map((line) => text(line)),
  ],
})

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
  ok(text("there is no exit. try 'ls contact' instead.", 'dim'))
