import type { Line } from '../commands/types'
import { art, hero, text } from '../commands/types'

// "hi its me, Jen!" — figlet `standard`, 62 columns. Shown on viewports wide
// enough to hold it; below 680px terminal.css swaps in the `hero` line instead.
const BANNER = [
  '  _     _   _ _                                _            _ ',
  ' | |__ (_) (_) |_ ___   _ __ ___   ___        | | ___ _ __ | |',
  " | '_ \\| | | | __/ __| | '_ ` _ \\ / _ \\    _  | |/ _ \\ '_ \\| |",
  ' | | | | | | | |_\\__ \\ | | | | | |  __/_  | |_| |  __/ | | |_|',
  ' |_| |_|_| |_|\\__|___/ |_| |_| |_|\\___( )  \\___/ \\___|_| |_(_)',
  '                                      |/',
]

export const BOOT: Line[] = [
  ...BANNER.map(art),
  hero("Hi, it's me Jen!"),
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
