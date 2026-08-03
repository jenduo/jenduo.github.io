import type { Line } from '../commands/types'
import { art, text } from '../commands/types'

// Pure ASCII on purpose: block and box-drawing characters are not reliably
// single-width across system monospace fonts, so they shear apart.
const LOGO = [
  '     _ ____  ',
  '    | |  _ \\ ',
  ' _  | | | | |',
  '| |_| | |_| |',
  ' \\___/|____/ ',
]

export const BOOT: Line[] = [
  ...LOGO.map((row) => art(row, 'accent')),
  text(''),
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
