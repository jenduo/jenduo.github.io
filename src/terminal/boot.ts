import type { Line } from '../commands/types'

export const BOOT: Line[] = [
  { type: 'text', text: 'jsh 1.0 — jenduo.github.io', tone: 'accent' },
  { type: 'text', text: '' },
  { type: 'text', text: "Jennifer Duong's portfolio, as a shell.", tone: 'bright' },
  { type: 'text', text: '' },
  { type: 'text', text: "type 'help' to look around, or click anything below.", tone: 'dim' },
  { type: 'text', text: '' },
  {
    type: 'paths',
    entries: [
      { name: 'about.txt', kind: 'file', path: '/about.txt' },
      { name: 'projects', kind: 'dir', path: '/projects' },
      { name: 'experience', kind: 'dir', path: '/experience' },
      { name: 'contact.txt', kind: 'file', path: '/contact.txt' },
    ],
  },
  { type: 'text', text: '' },
]
