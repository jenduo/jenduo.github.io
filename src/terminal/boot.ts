import type { Line } from '../commands/types'
import { hero, text } from '../commands/types'

export const BOOT: Line[] = [
  hero("Hi, it's me Jen!"),
  text('Jennifer Duong — software engineer', 'bright'),
  text('portfolio, as a shell', 'dim'),
  text(''),
  // Kept short so it does not wrap at phone width.
  text("type 'help', or click anything below.", 'dim'),
  text(''),
  {
    type: 'paths',
    entries: [
      { name: 'about.txt', kind: 'file', path: '/about.txt' },
      { name: 'projects', kind: 'dir', path: '/projects' },
      { name: 'experience', kind: 'dir', path: '/experience' },
      { name: 'contact.txt', kind: 'file', path: '/contact.txt' },
    ],
  },
  text(''),
]
