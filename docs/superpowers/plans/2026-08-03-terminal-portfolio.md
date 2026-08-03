# Terminal Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace jenduo.github.io with a single-page interactive terminal that visitors explore with shell commands to learn about Jennifer Duong as a software engineer.

**Architecture:** Four one-way layers. Content (`src/fs/tree.ts`) is pure data. The filesystem layer resolves paths against it. Commands are pure functions from `(args, context)` to output data — they never render. The React shell owns keyboard input and rendering. Adding a command touches one file plus a registry entry; changing the site's prose touches only `tree.ts`.

**Tech Stack:** Vite, React 19, TypeScript, Vitest. No runtime dependencies beyond React. Static build deployed to GitHub Pages via Actions.

**Spec:** `docs/superpowers/specs/2026-08-03-terminal-portfolio-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `src/fs/types.ts` | `FsNode` union — the shape of the virtual filesystem |
| `src/fs/resolve.ts` | Path normalization and node lookup. No content, no rendering |
| `src/fs/tree.ts` | **All site content.** The only file to edit when updating prose |
| `src/commands/types.ts` | `Command`, `CommandSpec`, `CommandResult`, `Line` contracts |
| `src/commands/nav.ts` | `pwd`, `ls`, `cd` |
| `src/commands/content.ts` | `cat`, `tree`, `open` |
| `src/commands/misc.ts` | `clear`, `whoami`, `history`, `echo`, `date`, `neofetch`, easter eggs |
| `src/commands/help.ts` | `help` — reads the registry, so it can never drift |
| `src/commands/index.ts` | Registry + `runCommand` dispatch with did-you-mean |
| `src/terminal/useShell.ts` | Shell state: cwd, output lines, input history |
| `src/terminal/complete.ts` | Tab completion for commands and paths |
| `src/terminal/Terminal.tsx` | Renders lines, owns the input element and key handling |
| `src/terminal/Line.tsx` | Renders one output line, including clickable path buttons |
| `src/terminal/boot.ts` | Boot sequence text |
| `src/styles/terminal.css` | Pink-on-black theme, scanlines, reduced-motion handling |
| `src/App.tsx`, `src/main.tsx` | Mount |
| `.github/workflows/deploy.yml` | Build and publish to Pages |

Tests sit beside their subjects as `*.test.ts`.

---

## Task 1: Scaffold the project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`
- Delete: nothing yet — the old site stays until Task 14

- [ ] **Step 1: Scaffold Vite into a temp dir and move it in**

The repo root is not empty, so scaffold aside and merge:

```bash
cd /Users/jenduong/Desktop/jenduo.github.io
npm create vite@latest .vite-scaffold -- --template react-ts
cp -R .vite-scaffold/src .vite-scaffold/index.html .vite-scaffold/vite.config.ts \
      .vite-scaffold/tsconfig*.json .vite-scaffold/package.json .
rm -rf .vite-scaffold
```

- [ ] **Step 2: Install dependencies including Vitest**

```bash
npm install
npm install -D vitest
```

- [ ] **Step 3: Add the test script and Vitest config**

In `package.json` add to `scripts`: `"test": "vitest run"`, `"test:watch": "vitest"`.

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  test: { environment: 'node' },
})
```

`base: '/'` is correct for a user site served from the domain root. A project site would need `/repo-name/`.

- [ ] **Step 4: Add a `.gitignore` entry for build output**

Append `node_modules/` and `dist/` to `.gitignore` (create the file if absent).

- [ ] **Step 5: Verify the toolchain runs**

```bash
npm run build && npm test
```

Expected: build succeeds; `npm test` reports "No test files found" and exits 1. That exit code is fine at this stage — Task 2 adds the first test.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold vite + react + ts + vitest"
```

---

## Task 2: Filesystem types

**Files:**
- Create: `src/fs/types.ts`

- [ ] **Step 1: Write the types**

```ts
export interface Dir {
  kind: 'dir'
  name: string
  children: FsNode[]
}

export interface FileNode {
  kind: 'file'
  name: string
  /** Text shown by `cat`. */
  body: string
  /** When set, `open` navigates here. */
  href?: string
}

export type FsNode = Dir | FileNode
```

Deliberately minimal — no permissions, mtimes, or symlinks. This is a browsing metaphor, not a POSIX emulator. Adding a field later is easy; removing one that commands depend on is not.

- [ ] **Step 2: Commit**

```bash
git add src/fs/types.ts && git commit -m "feat: virtual filesystem types"
```

---

## Task 3: Path resolution (TDD)

The only genuinely error-prone logic in the project. Tests first.

Path convention: `/` is home. The prompt displays `/` as `~` and `/projects` as `~/projects`.

**Files:**
- Create: `src/fs/resolve.test.ts`, `src/fs/resolve.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { displayPath, normalize, resolve } from './resolve'
import type { Dir } from './types'

const root: Dir = {
  kind: 'dir',
  name: '',
  children: [
    { kind: 'file', name: 'about.txt', body: 'hi' },
    {
      kind: 'dir',
      name: 'projects',
      children: [
        { kind: 'dir', name: 'alpha', children: [{ kind: 'file', name: 'README.md', body: 'a' }] },
      ],
    },
  ],
}

describe('normalize', () => {
  it('resolves a relative segment against cwd', () => {
    expect(normalize('/', 'projects')).toBe('/projects')
    expect(normalize('/projects', 'alpha')).toBe('/projects/alpha')
  })

  it('treats leading / and ~ as absolute', () => {
    expect(normalize('/projects/alpha', '/about.txt')).toBe('/about.txt')
    expect(normalize('/projects/alpha', '~')).toBe('/')
    expect(normalize('/projects/alpha', '~/projects')).toBe('/projects')
  })

  it('collapses . and ..', () => {
    expect(normalize('/projects/alpha', '..')).toBe('/projects')
    expect(normalize('/projects/alpha', '../..')).toBe('/')
    expect(normalize('/projects', './alpha/.')).toBe('/projects/alpha')
  })

  it('cannot escape the root', () => {
    expect(normalize('/', '..')).toBe('/')
    expect(normalize('/', '../../../etc')).toBe('/etc')
  })

  it('ignores empty and repeated separators', () => {
    expect(normalize('/', 'projects//alpha/')).toBe('/projects/alpha')
    expect(normalize('/projects', '')).toBe('/projects')
  })
})

describe('resolve', () => {
  it('finds a directory', () => {
    expect(resolve(root, '/', 'projects')).toMatchObject({ kind: 'dir', name: 'projects' })
  })

  it('finds a nested file', () => {
    expect(resolve(root, '/projects/alpha', 'README.md')).toMatchObject({ name: 'README.md' })
  })

  it('resolves the root itself', () => {
    expect(resolve(root, '/', '.')).toBe(root)
    expect(resolve(root, '/projects', '~')).toBe(root)
  })

  it('returns null for a missing node', () => {
    expect(resolve(root, '/', 'nope')).toBeNull()
  })

  it('returns null when descending through a file', () => {
    expect(resolve(root, '/', 'about.txt/deeper')).toBeNull()
  })
})

describe('displayPath', () => {
  it('renders home as ~', () => {
    expect(displayPath('/')).toBe('~')
    expect(displayPath('/projects/alpha')).toBe('~/projects/alpha')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/fs/resolve.test.ts`
Expected: FAIL — cannot resolve `./resolve`.

- [ ] **Step 3: Write the implementation**

```ts
import type { Dir, FsNode } from './types'

export function splitPath(input: string): string[] {
  return input.split('/').filter((segment) => segment.length > 0)
}

export function normalize(cwd: string, input: string): string {
  const isAbsolute = input.startsWith('/') || input.startsWith('~')
  const base = isAbsolute ? [] : splitPath(cwd)
  const segments = splitPath(isAbsolute ? input.replace(/^~/, '') : input)

  const out = [...base]
  for (const segment of segments) {
    if (segment === '.') continue
    if (segment === '..') {
      out.pop()
      continue
    }
    out.push(segment)
  }
  return '/' + out.join('/')
}

export function resolve(root: Dir, cwd: string, input: string): FsNode | null {
  let node: FsNode = root
  for (const segment of splitPath(normalize(cwd, input))) {
    if (node.kind !== 'dir') return null
    const next = node.children.find((child) => child.name === segment)
    if (!next) return null
    node = next
  }
  return node
}

export function displayPath(path: string): string {
  return path === '/' ? '~' : '~' + path
}
```

`out.pop()` on an empty array is a no-op, which is exactly why `..` at the root stays at the root.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/fs/resolve.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 5: Commit**

```bash
git add src/fs/resolve.ts src/fs/resolve.test.ts
git commit -m "feat: path resolution for the virtual filesystem"
```

---

## Task 4: Site content

Every word on the site lives here. `[TODO]` markers are load-bearing: they mark
claims that were inferred rather than confirmed, so placeholder text cannot ship
as fact by accident. Do not remove them or smooth them into confident prose.

**Files:**
- Create: `src/fs/tree.ts`

- [ ] **Step 1: Write the content tree**

```ts
import type { Dir } from './types'

const about = `Jennifer Duong — software engineer

  I build web products end to end. [TODO: one sentence in your own words
  about what you like building — this is the line people actually read.]

  Currently [TODO: your title] at InvestorHub, working on [TODO: what you
  work on, at whatever detail you are comfortable making public].

  Before that: [TODO: study and/or previous roles. Your 2022-23 repos suggest
  a computer science background — algorithms, automata, software design.]

  Try:  ls projects     cat skills.txt     cat contact.txt
`

const skills = `languages    TypeScript · JavaScript · Python · SQL
frontend     React · [TODO: confirm — Tailwind? plain CSS? something else?]
backend      [TODO: confirm — Node? Rails? Django?]
data / ML    PyTorch · BoTorch · Gaussian processes · Bayesian optimization
tooling      Git · [TODO: confirm — Docker? CI? cloud platforms?]

  [TODO: this list is inferred from your public repos, not from you. Delete
  anything you would not want to be interviewed on.]
`

const contact = `email      [TODO: a personal address. Do not ship your work address on a
           public portfolio — especially not one used for job hunting.]
github     github.com/jenduo
linkedin   [TODO: your profile URL]

  Try:  open resume.pdf
`

const resume = `[TODO: drop resume.pdf into public/, then set href: '/resume.pdf'
on this node in src/fs/tree.ts. Until then 'open resume.pdf' explains that
it is not up yet.]
`

const investorhub = `# InvestorHub

  [TODO: your title] · [TODO: start date] – present

  InvestorHub builds investor relations software for listed companies —
  shareholder analytics, communications, and engagement tooling.

  What I work on:
    - [TODO]
    - [TODO]
    - [TODO]

  [TODO: keep this to what is public. When in doubt describe the kind of
  problem rather than the internal system that solves it.]
`

const asxReadme = `# asx-company-info

  A tool for comparing ASX-listed companies side by side.

  People want two different things from a comparison tool: a fast throwaway
  look, and a way to keep the comparisons that matter. So it does both —
  quick comparisons need no setup, and any comparison can be saved as a
  favourite, backed by SQL.

  Comparisons are shareable as query URLs. That was a deliberate limit: a
  shared link is a read-only slice of the tool, which nudges the recipient
  toward running their own comparisons rather than living in someone else's.

  Ticker input is validated on entry rather than downstream, so bad input
  fails where the user can still see what they typed.

  open this file to go to the repo.
`

const mfboReadme = `# mfbo-framework

  A generalized multi-fidelity Bayesian optimization framework.

  Multi-fidelity optimization earns its complexity when the objective is
  expensive to evaluate: alongside the true function you sample cheap
  approximations, and let the model decide when a cheap look is good enough.

  Runs against four synthetic benchmarks — Forrester, Branin, Borehole and
  Hartmann — with EI, PI, UCB and KG acquisition functions, and either greedy
  or uncertainty-driven high-fidelity selection.

  Built for concurrent HPC experiments, so results stream to CSV with safe
  concurrent writes, and a new benchmark or acquisition strategy is a new
  module rather than an edit to the core.

  open this file to go to the repo.
`

const poketrackReadme = `# fleng-poketrack

  [TODO: what is this? The repo is JavaScript with no README, so there is
  nothing accurate to say about it yet.

  If it is not portfolio-worthy, delete this whole directory from
  src/fs/tree.ts — three strong projects beat four with a gap in them.]

  open this file to go to the repo.
`

function project(name: string, readme: string, stack: string): Dir {
  return {
    kind: 'dir',
    name,
    children: [
      {
        kind: 'file',
        name: 'README.md',
        body: readme,
        href: `https://github.com/jenduo/${name}`,
      },
      { kind: 'file', name: 'stack.txt', body: stack },
    ],
  }
}

export const root: Dir = {
  kind: 'dir',
  name: '',
  children: [
    { kind: 'file', name: 'about.txt', body: about },
    { kind: 'file', name: 'skills.txt', body: skills },
    { kind: 'file', name: 'contact.txt', body: contact },
    { kind: 'file', name: 'resume.pdf', body: resume },
    {
      kind: 'dir',
      name: 'experience',
      children: [{ kind: 'file', name: 'investorhub.md', body: investorhub }],
    },
    {
      kind: 'dir',
      name: 'projects',
      children: [
        project('asx-company-info', asxReadme, 'TypeScript · SQL · query-param state\n'),
        project('mfbo-framework', mfboReadme, 'Python · PyTorch · BoTorch · GPyTorch\n'),
        project('fleng-poketrack', poketrackReadme, 'JavaScript\n'),
      ],
    },
  ],
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/fs/tree.ts && git commit -m "feat: site content tree"
```

---

## Task 5: Command contracts

**Files:**
- Create: `src/commands/types.ts`

- [ ] **Step 1: Write the contracts**

```ts
import type { Dir } from '../fs/types'

export type Tone = 'default' | 'dim' | 'bright' | 'accent' | 'error'

export interface PathEntry {
  name: string
  kind: 'dir' | 'file'
  /** Absolute path, so a click does not depend on the cwd at click time. */
  path: string
}

export type Line =
  /** An echoed prompt line, e.g. `~/projects $ ls`. */
  | { type: 'prompt'; cwd: string; input: string }
  | { type: 'text'; text: string; tone?: Tone }
  /** Path names rendered as clickable buttons. */
  | { type: 'paths'; entries: PathEntry[] }

export interface ShellContext {
  root: Dir
  cwd: string
  history: string[]
}

export interface CommandResult {
  lines: Line[]
  /** Set to move the shell to a new directory. */
  cwd?: string
  /** Set to wipe the scrollback. */
  clear?: boolean
  /** Set to navigate the browser to a URL. */
  openUrl?: string
}

export type Command = (args: string[], ctx: ShellContext) => CommandResult

export interface CommandSpec {
  name: string
  usage: string
  summary: string
  /** Hidden from `help` — the easter eggs. */
  hidden?: boolean
  run: Command
}

export const text = (text: string, tone?: Tone): Line => ({ type: 'text', text, tone })
export const error = (message: string): Line => ({ type: 'text', text: message, tone: 'error' })
export const ok = (...lines: Line[]): CommandResult => ({ lines })
```

Commands return data and never render. That is what makes them testable without a
DOM, and it is why `cd` returns a new `cwd` instead of mutating anything.

- [ ] **Step 2: Commit**

```bash
git add src/commands/types.ts && git commit -m "feat: command contracts"
```

---

## Task 6: Navigation commands — pwd, ls, cd (TDD)

**Files:**
- Create: `src/commands/nav.test.ts`, `src/commands/nav.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { cd, ls, pwd } from './nav'
import type { ShellContext } from './types'
import { root } from '../fs/tree'

const ctx = (cwd: string): ShellContext => ({ root, cwd, history: [] })

describe('pwd', () => {
  it('prints the current directory with ~ for home', () => {
    expect(pwd([], ctx('/')).lines).toEqual([{ type: 'text', text: '~', tone: undefined }])
    expect(pwd([], ctx('/projects')).lines[0]).toMatchObject({ text: '~/projects' })
  })
})

describe('ls', () => {
  it('lists the current directory as path entries', () => {
    const [line] = ls([], ctx('/')).lines
    expect(line.type).toBe('paths')
    if (line.type !== 'paths') throw new Error('expected paths')
    expect(line.entries.map((e) => e.name)).toContain('about.txt')
    expect(line.entries.map((e) => e.name)).toContain('projects')
  })

  it('sorts directories before files', () => {
    const [line] = ls([], ctx('/')).lines
    if (line.type !== 'paths') throw new Error('expected paths')
    const firstFile = line.entries.findIndex((e) => e.kind === 'file')
    const lastDir = line.entries.map((e) => e.kind).lastIndexOf('dir')
    expect(lastDir).toBeLessThan(firstFile)
  })

  it('gives entries absolute paths', () => {
    const [line] = ls(['projects'], ctx('/')).lines
    if (line.type !== 'paths') throw new Error('expected paths')
    expect(line.entries[0].path).toMatch(/^\/projects\//)
  })

  it('lists a named directory', () => {
    const [line] = ls(['projects'], ctx('/')).lines
    if (line.type !== 'paths') throw new Error('expected paths')
    expect(line.entries.map((e) => e.name)).toContain('mfbo-framework')
  })

  it('prints just the name when given a file', () => {
    expect(ls(['about.txt'], ctx('/')).lines[0]).toMatchObject({ type: 'text', text: 'about.txt' })
  })

  it('errors on a missing path', () => {
    expect(ls(['nope'], ctx('/')).lines[0]).toMatchObject({
      tone: 'error',
      text: "ls: nope: No such file or directory",
    })
  })
})

describe('cd', () => {
  it('enters a directory and returns the new cwd', () => {
    expect(cd(['projects'], ctx('/')).cwd).toBe('/projects')
  })

  it('goes home with no argument', () => {
    expect(cd([], ctx('/projects/mfbo-framework')).cwd).toBe('/')
  })

  it('goes up with ..', () => {
    expect(cd(['..'], ctx('/projects')).cwd).toBe('/')
  })

  it('refuses to cd into a file', () => {
    const result = cd(['about.txt'], ctx('/'))
    expect(result.cwd).toBeUndefined()
    expect(result.lines[0]).toMatchObject({ tone: 'error', text: 'cd: about.txt: Not a directory' })
  })

  it('errors on a missing directory', () => {
    const result = cd(['nope'], ctx('/'))
    expect(result.cwd).toBeUndefined()
    expect(result.lines[0]).toMatchObject({ tone: 'error' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/commands/nav.test.ts`
Expected: FAIL — cannot resolve `./nav`.

- [ ] **Step 3: Write the implementation**

```ts
import { displayPath, normalize, resolve } from '../fs/resolve'
import type { Command, PathEntry } from './types'
import { error, ok, text } from './types'

export const pwd: Command = (_args, ctx) => ok(text(displayPath(ctx.cwd)))

function entriesOf(dirPath: string, children: { kind: 'dir' | 'file'; name: string }[]): PathEntry[] {
  const base = dirPath === '/' ? '' : dirPath
  return [...children]
    .sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'dir' ? -1 : 1))
    .map(({ name, kind }) => ({ name, kind, path: `${base}/${name}` }))
}

export const ls: Command = (args, ctx) => {
  const target = args[0] ?? '.'
  const node = resolve(ctx.root, ctx.cwd, target)
  if (!node) return ok(error(`ls: ${target}: No such file or directory`))
  if (node.kind === 'file') return ok(text(node.name))
  return ok({ type: 'paths', entries: entriesOf(normalize(ctx.cwd, target), node.children) })
}

export const cd: Command = (args, ctx) => {
  const target = args[0] ?? '~'
  const node = resolve(ctx.root, ctx.cwd, target)
  if (!node) return ok(error(`cd: ${target}: No such file or directory`))
  if (node.kind === 'file') return ok(error(`cd: ${target}: Not a directory`))
  return { lines: [], cwd: normalize(ctx.cwd, target) }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/commands/nav.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/commands/nav.ts src/commands/nav.test.ts
git commit -m "feat: pwd, ls and cd"
```

---

## Task 7: Content commands — cat, tree, open (TDD)

**Files:**
- Create: `src/commands/content.test.ts`, `src/commands/content.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { cat, open, tree } from './content'
import type { ShellContext } from './types'
import { root } from '../fs/tree'

const ctx = (cwd: string): ShellContext => ({ root, cwd, history: [] })

describe('cat', () => {
  it('prints a file body one line per line', () => {
    const result = cat(['about.txt'], ctx('/'))
    expect(result.lines.length).toBeGreaterThan(1)
    expect(result.lines[0]).toMatchObject({ type: 'text' })
  })

  it('requires an argument', () => {
    expect(cat([], ctx('/')).lines[0]).toMatchObject({ tone: 'error', text: 'usage: cat <file>' })
  })

  it('refuses a directory', () => {
    expect(cat(['projects'], ctx('/')).lines[0]).toMatchObject({
      tone: 'error',
      text: 'cat: projects: Is a directory',
    })
  })

  it('errors on a missing file', () => {
    expect(cat(['nope'], ctx('/')).lines[0]).toMatchObject({ tone: 'error' })
  })
})

describe('tree', () => {
  it('renders nested structure with indent guides', () => {
    const rendered = tree([], ctx('/')).lines
    const paths = rendered.filter((l) => l.type === 'paths')
    expect(paths.length).toBeGreaterThan(3)
  })

  it('errors on a missing path', () => {
    expect(tree(['nope'], ctx('/')).lines[0]).toMatchObject({ tone: 'error' })
  })
})

describe('open', () => {
  it('returns the href of a linked file', () => {
    expect(open(['projects/mfbo-framework/README.md'], ctx('/')).openUrl).toBe(
      'https://github.com/jenduo/mfbo-framework',
    )
  })

  it('explains when a file has no link', () => {
    const result = open(['resume.pdf'], ctx('/'))
    expect(result.openUrl).toBeUndefined()
    expect(result.lines[0]).toMatchObject({ tone: 'error' })
    expect(result.lines[0].type === 'text' && result.lines[0].text).toContain('not uploaded')
  })

  it('requires an argument', () => {
    expect(open([], ctx('/')).lines[0]).toMatchObject({ text: 'usage: open <file>' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/commands/content.test.ts`
Expected: FAIL — cannot resolve `./content`.

- [ ] **Step 3: Write the implementation**

```ts
import { normalize, resolve } from '../fs/resolve'
import type { Dir } from '../fs/types'
import type { Command, Line } from './types'
import { error, ok, text } from './types'

export const cat: Command = (args, ctx) => {
  const target = args[0]
  if (!target) return ok(error('usage: cat <file>'))
  const node = resolve(ctx.root, ctx.cwd, target)
  if (!node) return ok(error(`cat: ${target}: No such file or directory`))
  if (node.kind === 'dir') return ok(error(`cat: ${target}: Is a directory`))
  return { lines: node.body.split('\n').map((line) => text(line)) }
}

function walk(dir: Dir, dirPath: string, prefix: string): Line[] {
  const base = dirPath === '/' ? '' : dirPath
  const children = [...dir.children].sort((a, b) =>
    a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'dir' ? -1 : 1,
  )

  return children.flatMap((child, index) => {
    const last = index === children.length - 1
    const path = `${base}/${child.name}`
    const line: Line = {
      type: 'paths',
      entries: [{ name: `${prefix}${last ? '└── ' : '├── '}${child.name}`, kind: child.kind, path }],
    }
    if (child.kind !== 'dir') return [line]
    return [line, ...walk(child, path, `${prefix}${last ? '    ' : '│   '}`)]
  })
}

export const tree: Command = (args, ctx) => {
  const target = args[0] ?? '.'
  const node = resolve(ctx.root, ctx.cwd, target)
  if (!node) return ok(error(`tree: ${target}: No such file or directory`))
  if (node.kind === 'file') return ok(text(node.name))
  return { lines: [text('.'), ...walk(node, normalize(ctx.cwd, target), '')] }
}

export const open: Command = (args, ctx) => {
  const target = args[0]
  if (!target) return ok(error('usage: open <file>'))
  const node = resolve(ctx.root, ctx.cwd, target)
  if (!node) return ok(error(`open: ${target}: No such file or directory`))
  if (node.kind === 'dir') return ok(error(`open: ${target}: Is a directory`))
  if (!node.href) {
    return ok(error(`open: ${target}: nothing to open yet — not uploaded`))
  }
  return { lines: [text(`opening ${node.href}`, 'dim')], openUrl: node.href }
}
```

The `name` field carrying indent guides is a small compromise: it keeps `tree`
output clickable without inventing a second line type for decorated paths. The
click target is `path`, which stays clean.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/commands/content.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/commands/content.ts src/commands/content.test.ts
git commit -m "feat: cat, tree and open"
```

---

## Task 8: Miscellaneous commands and easter eggs

**Files:**
- Create: `src/commands/misc.ts`

- [ ] **Step 1: Write the implementation**

```ts
import type { Command } from './types'
import { error, ok, text } from './types'

export const clear: Command = () => ({ lines: [], clear: true })

export const whoami: Command = () => ok(text('visitor'))

export const echo: Command = (args) => ok(text(args.join(' ')))

export const history: Command = (_args, ctx) =>
  ctx.history.length === 0
    ? ok(text('no history yet', 'dim'))
    : { lines: ctx.history.map((entry, i) => text(`${String(i + 1).padStart(4)}  ${entry}`)) }

const LOGO = [
  '   ╭───────────────╮',
  '   │  ╷ ╭─╮ ╭╮ ╷   │',
  '   │  │ ├─┤ ││ │   │',
  '   │  ╰ ╵ ╵ ╵╵ ╵   │',
  '   ╰───────────────╯',
]

export const neofetch: Command = (_args, ctx) => {
  const facts = [
    ['visitor', '@jenduo.github.io'],
    ['─────────', ''],
    ['host', 'jenduo.github.io'],
    ['shell', 'jsh 1.0'],
    ['role', 'software engineer'],
    ['stack', 'TypeScript · React · Python'],
    ['cwd', ctx.cwd],
    ['contact', 'cat contact.txt'],
  ]
  const rows = Math.max(LOGO.length, facts.length)
  const lines = []
  for (let i = 0; i < rows; i++) {
    const art = (LOGO[i] ?? '').padEnd(22)
    const [key, value] = facts[i] ?? ['', '']
    lines.push(text(`${art}${key ? key.padEnd(10) + value : ''}`))
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

export const date: Command = () => ok(text(new Date().toString()))
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/commands/misc.ts && git commit -m "feat: misc commands and easter eggs"
```

---

## Task 9: Registry, help, and dispatch (TDD)

`help` reads the registry rather than a hand-written list, so the two cannot drift
apart. A test enforces that.

**Files:**
- Create: `src/commands/help.ts`, `src/commands/index.ts`, `src/commands/index.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { COMMANDS, runCommand } from './index'
import type { ShellContext } from './types'
import { root } from '../fs/tree'

const ctx = (cwd = '/'): ShellContext => ({ root, cwd, history: [] })

describe('registry', () => {
  it('has no duplicate names', () => {
    const names = COMMANDS.map((c) => c.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('gives every visible command a usage and summary', () => {
    for (const command of COMMANDS.filter((c) => !c.hidden)) {
      expect(command.usage, command.name).toBeTruthy()
      expect(command.summary, command.name).toBeTruthy()
    }
  })
})

describe('help', () => {
  it('lists every visible command and no hidden ones', () => {
    const output = runCommand('help', ctx())
      .lines.map((l) => (l.type === 'text' ? l.text : ''))
      .join('\n')
    for (const command of COMMANDS.filter((c) => !c.hidden)) {
      expect(output, command.name).toContain(command.name)
    }
    expect(output).not.toContain('sudo')
  })
})

describe('runCommand', () => {
  it('echoes the input as a prompt line', () => {
    expect(runCommand('pwd', ctx()).lines[0]).toMatchObject({ type: 'prompt', input: 'pwd' })
  })

  it('does nothing useful for blank input', () => {
    expect(runCommand('   ', ctx()).lines).toHaveLength(1)
  })

  it('splits arguments on whitespace', () => {
    const output = runCommand('echo hello  world', ctx()).lines
    expect(output[1]).toMatchObject({ text: 'hello world' })
  })

  it('reports an unknown command', () => {
    const output = runCommand('frobnicate', ctx()).lines
    expect(output[1]).toMatchObject({ tone: 'error' })
    expect(output[1].type === 'text' && output[1].text).toContain('command not found')
  })

  it('suggests a near miss', () => {
    const output = runCommand('sl', ctx())
      .lines.map((l) => (l.type === 'text' ? l.text : ''))
      .join('\n')
    expect(output).toContain('ls')
  })

  it('passes cwd changes through', () => {
    expect(runCommand('cd projects', ctx()).cwd).toBe('/projects')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/commands/index.test.ts`
Expected: FAIL — cannot resolve `./index`.

- [ ] **Step 3: Write `help.ts`**

```ts
import type { Command, CommandSpec } from './types'
import { text } from './types'

/** Injected to avoid a circular import with the registry. */
export function makeHelp(commands: () => CommandSpec[]): Command {
  return () => {
    const visible = commands().filter((command) => !command.hidden)
    const width = Math.max(...visible.map((command) => command.usage.length))
    return {
      lines: [
        text('available commands', 'accent'),
        text(''),
        ...visible.map((command) =>
          text(`  ${command.usage.padEnd(width + 3)}${command.summary}`),
        ),
        text(''),
        text('  tab completes · ↑ ↓ walks history · click any filename', 'dim'),
      ],
    }
  }
}
```

- [ ] **Step 4: Write `index.ts`**

```ts
import { cd, ls, pwd } from './nav'
import { cat, open, tree } from './content'
import { clear, date, echo, exit, history, neofetch, rm, sudo, whoami } from './misc'
import { makeHelp } from './help'
import type { CommandResult, CommandSpec, ShellContext } from './types'
import { error, text } from './types'

export const COMMANDS: CommandSpec[] = [
  { name: 'help', usage: 'help', summary: 'show this list', run: makeHelp(() => COMMANDS) },
  { name: 'ls', usage: 'ls [path]', summary: 'list what is here', run: ls },
  { name: 'cd', usage: 'cd [path]', summary: 'change directory', run: cd },
  { name: 'cat', usage: 'cat <file>', summary: 'read a file', run: cat },
  { name: 'tree', usage: 'tree [path]', summary: 'see everything at once', run: tree },
  { name: 'open', usage: 'open <file>', summary: 'open the real link behind a file', run: open },
  { name: 'pwd', usage: 'pwd', summary: 'where am I', run: pwd },
  { name: 'whoami', usage: 'whoami', summary: 'who am I', run: whoami },
  { name: 'neofetch', usage: 'neofetch', summary: 'the short version', run: neofetch },
  { name: 'history', usage: 'history', summary: 'what I have typed', run: history },
  { name: 'clear', usage: 'clear', summary: 'wipe the screen', run: clear },
  { name: 'echo', usage: 'echo <text>', summary: 'say it back', run: echo },
  { name: 'date', usage: 'date', summary: 'the time here', run: date },
  { name: 'sudo', usage: 'sudo', summary: '', hidden: true, run: sudo },
  { name: 'rm', usage: 'rm', summary: '', hidden: true, run: rm },
  { name: 'exit', usage: 'exit', summary: '', hidden: true, run: exit },
]

/** Levenshtein distance, for did-you-mean. */
function distance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
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
  const [best] = COMMANDS.filter((c) => !c.hidden)
    .map((c) => ({ name: c.name, d: distance(input, c.name) }))
    .sort((a, b) => a.d - b.d)
  return best && best.d <= 2 ? best.name : null
}

export function runCommand(input: string, ctx: ShellContext): CommandResult {
  const echoed = { type: 'prompt' as const, cwd: ctx.cwd, input }
  const [name, ...args] = input.trim().split(/\s+/).filter(Boolean)
  if (!name) return { lines: [echoed] }

  const command = COMMANDS.find((c) => c.name === name)
  if (!command) {
    const near = suggest(name)
    return {
      lines: [
        echoed,
        error(`jsh: command not found: ${name}`),
        ...(near ? [text(`did you mean '${near}'?`, 'dim')] : [text("type 'help' for a list", 'dim')]),
      ],
    }
  }

  const result = command.run(args, ctx)
  return { ...result, lines: [echoed, ...result.lines] }
}
```

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS, all files.

- [ ] **Step 6: Commit**

```bash
git add src/commands/help.ts src/commands/index.ts src/commands/index.test.ts
git commit -m "feat: command registry, help and dispatch"
```

---

## Task 10: Tab completion (TDD)

**Files:**
- Create: `src/terminal/complete.test.ts`, `src/terminal/complete.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { complete } from './complete'
import { root } from '../fs/tree'

describe('complete', () => {
  it('completes a command name at the start of the line', () => {
    expect(complete('ne', root, '/')).toBe('neofetch ')
  })

  it('leaves an ambiguous prefix alone', () => {
    expect(complete('c', root, '/')).toBe('c')
  })

  it('completes a path argument', () => {
    expect(complete('cat ab', root, '/')).toBe('cat about.txt ')
  })

  it('appends a slash for directories', () => {
    expect(complete('cd exp', root, '/')).toBe('cd experience/')
  })

  it('completes inside a nested path', () => {
    expect(complete('cat projects/mf', root, '/')).toBe('cat projects/mfbo-framework/')
  })

  it('respects the cwd', () => {
    expect(complete('cat inv', root, '/experience')).toBe('cat investorhub.md ')
  })

  it('returns the input unchanged when nothing matches', () => {
    expect(complete('cat zzz', root, '/')).toBe('cat zzz')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/terminal/complete.test.ts`
Expected: FAIL — cannot resolve `./complete`.

- [ ] **Step 3: Write the implementation**

```ts
import { COMMANDS } from '../commands/index'
import { resolve } from '../fs/resolve'
import type { Dir } from '../fs/types'

function onlyMatch(candidates: string[], prefix: string): string | null {
  const matches = candidates.filter((candidate) => candidate.startsWith(prefix))
  return matches.length === 1 ? matches[0] : null
}

export function complete(input: string, root: Dir, cwd: string): string {
  const parts = input.split(/(\s+)/)

  // Completing the command itself.
  if (parts.length === 1) {
    const match = onlyMatch(
      COMMANDS.filter((c) => !c.hidden).map((c) => c.name),
      input,
    )
    return match ? `${match} ` : input
  }

  const fragment = parts[parts.length - 1]
  const slash = fragment.lastIndexOf('/')
  const dirPart = slash === -1 ? '.' : fragment.slice(0, slash + 1)
  const namePart = slash === -1 ? fragment : fragment.slice(slash + 1)

  const dir = resolve(root, cwd, dirPart)
  if (!dir || dir.kind !== 'dir') return input

  const match = dir.children.find((child) => child.name.startsWith(namePart))
  const unique =
    dir.children.filter((child) => child.name.startsWith(namePart)).length === 1 ? match : null
  if (!unique) return input

  const suffix = unique.kind === 'dir' ? '/' : ' '
  const head = parts.slice(0, -1).join('')
  return `${head}${dirPart === '.' ? '' : dirPart}${unique.name}${suffix}`
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/terminal/complete.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/terminal/complete.ts src/terminal/complete.test.ts
git commit -m "feat: tab completion for commands and paths"
```

---

## Task 11: Shell state

**Files:**
- Create: `src/terminal/boot.ts`, `src/terminal/useShell.ts`

- [ ] **Step 1: Write the boot sequence**

```ts
import type { Line } from '../commands/types'

export const BOOT: Line[] = [
  { type: 'text', text: 'jsh 1.0 — jenduo.github.io', tone: 'accent' },
  { type: 'text', text: '' },
  { type: 'text', text: "Jennifer Duong's portfolio, as a shell.", tone: 'bright' },
  { type: 'text', text: '' },
  { type: 'text', text: "type 'help' to look around, or click any filename below.", tone: 'dim' },
  { type: 'text', text: '' },
  { type: 'paths', entries: [
    { name: 'about.txt', kind: 'file', path: '/about.txt' },
    { name: 'projects', kind: 'dir', path: '/projects' },
    { name: 'experience', kind: 'dir', path: '/experience' },
    { name: 'contact.txt', kind: 'file', path: '/contact.txt' },
  ] },
  { type: 'text', text: '' },
]
```

- [ ] **Step 2: Write the shell hook**

```ts
import { useCallback, useState } from 'react'
import { runCommand } from '../commands/index'
import type { Line } from '../commands/types'
import { root } from '../fs/tree'
import { BOOT } from './boot'

export function useShell() {
  const [cwd, setCwd] = useState('/')
  const [lines, setLines] = useState<Line[]>(BOOT)
  const [history, setHistory] = useState<string[]>([])

  const submit = useCallback(
    (input: string) => {
      setHistory((previous) => (input.trim() ? [...previous, input] : previous))

      setCwd((currentCwd) => {
        const result = runCommand(input, { root, cwd: currentCwd, history })
        setLines((previous) => (result.clear ? [] : [...previous, ...result.lines]))
        if (result.openUrl) window.open(result.openUrl, '_blank', 'noopener,noreferrer')
        return result.cwd ?? currentCwd
      })
    },
    [history],
  )

  return { cwd, lines, history, submit, root }
}
```

Running the command inside `setCwd` keeps the read of `cwd` and the write of the
next one in the same update, so two commands submitted in the same tick cannot
resolve against a stale directory.

- [ ] **Step 3: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/terminal/boot.ts src/terminal/useShell.ts
git commit -m "feat: shell state and boot sequence"
```

---

## Task 12: Terminal UI

**Files:**
- Create: `src/terminal/Line.tsx`, `src/terminal/Terminal.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: Write `Line.tsx`**

Clickable paths are the accessibility story for this site, so they are real
`<button>` elements — focusable, keyboard-activatable, and screen-reader legible.

```tsx
import type { Line as LineData } from '../commands/types'
import { displayPath } from '../fs/resolve'

interface Props {
  line: LineData
  onRun: (input: string) => void
}

export function Line({ line, onRun }: Props) {
  if (line.type === 'prompt') {
    return (
      <div className="line">
        <span className="prompt">{displayPath(line.cwd)}</span>
        <span className="sigil"> $ </span>
        <span>{line.input}</span>
      </div>
    )
  }

  if (line.type === 'text') {
    return <div className={`line tone-${line.tone ?? 'default'}`}>{line.text || ' '}</div>
  }

  return (
    <div className="line entries">
      {line.entries.map((entry) => (
        <button
          key={entry.path + entry.name}
          type="button"
          className={`entry entry-${entry.kind}`}
          onClick={() => onRun(`${entry.kind === 'dir' ? 'cd' : 'cat'} ${entry.path}`)}
          aria-label={`${entry.kind === 'dir' ? 'open directory' : 'read file'} ${entry.name.trim()}`}
        >
          {entry.name}
          {entry.kind === 'dir' ? '/' : ''}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Write `Terminal.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { displayPath } from '../fs/resolve'
import { complete } from './complete'
import { Line } from './Line'
import { useShell } from './useShell'

const CHIPS = ['help', 'ls', 'cat about.txt', 'cd projects', 'tree', 'neofetch']

export function Terminal() {
  const { cwd, lines, history, submit, root } = useShell()
  const [input, setInput] = useState('')
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [lines])

  function run(command: string) {
    submit(command)
    setInput('')
    setHistoryIndex(null)
    inputRef.current?.focus()
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      run(input)
      return
    }

    if (event.key === 'Tab') {
      event.preventDefault()
      setInput((current) => complete(current, root, cwd))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (history.length === 0) return
      const next = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(next)
      setInput(history[next])
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (historyIndex === null) return
      const next = historyIndex + 1
      if (next >= history.length) {
        setHistoryIndex(null)
        setInput('')
        return
      }
      setHistoryIndex(next)
      setInput(history[next])
    }
  }

  return (
    <main className="terminal" onClick={() => inputRef.current?.focus()}>
      <div className="scanlines" aria-hidden="true" />

      <div className="scrollback" role="log" aria-live="polite">
        {lines.map((line, index) => (
          <Line key={index} line={line} onRun={run} />
        ))}
        <div ref={endRef} />
      </div>

      <div className="chips" aria-label="example commands">
        {CHIPS.map((chip) => (
          <button key={chip} type="button" className="chip" onClick={() => run(chip)}>
            {chip}
          </button>
        ))}
      </div>

      <div className="inputline">
        <label className="prompt" htmlFor="jsh-input">
          {displayPath(cwd)}
        </label>
        <span className="sigil"> $ </span>
        <input
          id="jsh-input"
          ref={inputRef}
          className="input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="terminal input"
          autoFocus
        />
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Wire up `App.tsx` and `main.tsx`**

`src/App.tsx`:

```tsx
import { Terminal } from './terminal/Terminal'
import './styles/terminal.css'

export default function App() {
  return <Terminal />
}
```

`src/main.tsx`: keep the generated file, but delete the `import './index.css'`
line and remove `src/index.css` and `src/App.css` if the template created them.

- [ ] **Step 4: Verify it type-checks and builds**

```bash
npx tsc --noEmit && npm run build
```

Expected: no errors. Styling comes next, so the page will look unstyled.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: terminal UI with clickable paths and history"
```

---

## Task 13: Pink-on-black styling

**Files:**
- Create: `src/styles/terminal.css`
- Modify: `index.html`

- [ ] **Step 1: Write the stylesheet**

```css
:root {
  --bg: #0b0709;
  --fg: #ffa6c9;
  --fg-dim: #8a5f72;
  --accent: #ff3d8a;
  --bright: #f5e6ed;
  --glow: rgba(255, 61, 138, 0.35);
  --mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas,
    'Liberation Mono', monospace;
}

* { box-sizing: border-box; }

html, body, #root { height: 100%; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font: 15px/1.55 var(--mono);
  /* Keeps long output readable on a dark background. */
  text-shadow: 0 0 6px var(--glow);
}

.terminal {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: clamp(16px, 4vw, 40px);
  overflow: hidden;
}

.scrollback {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.line { white-space: pre-wrap; word-break: break-word; }

.tone-dim { color: var(--fg-dim); }
.tone-bright { color: var(--bright); }
.tone-accent { color: var(--accent); }
.tone-error { color: #ff5c7a; }

.prompt { color: var(--accent); font-weight: 700; }
.sigil { color: var(--fg-dim); }

.entries { display: flex; flex-wrap: wrap; gap: 0 1.5ch; }

.entry {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-shadow: inherit;
  white-space: pre;
  cursor: pointer;
  border-radius: 2px;
}

.entry-dir { color: var(--accent); font-weight: 700; }
.entry-file { color: var(--fg); }

.entry:hover, .entry:focus-visible {
  color: var(--bright);
  outline: 1px solid var(--accent);
  outline-offset: 2px;
}

.inputline { display: flex; align-items: baseline; padding-top: 4px; }

.input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: none;
  color: var(--bright);
  font: inherit;
  text-shadow: inherit;
  caret-color: var(--accent);
  outline: none;
}

.chips { display: none; }

/* Phone keyboards make `cd projects/` a reason to leave. */
@media (max-width: 640px) {
  .chips {
    display: flex;
    gap: 8px;
    padding: 10px 0 6px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .chips::-webkit-scrollbar { display: none; }

  .chip {
    flex: 0 0 auto;
    padding: 6px 10px;
    border: 1px solid var(--fg-dim);
    border-radius: 999px;
    background: none;
    color: var(--fg);
    font: 13px var(--mono);
    white-space: nowrap;
  }
}

.scanlines {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    rgba(255, 61, 138, 0.04) 0 1px,
    transparent 1px 3px
  );
}

@media (prefers-reduced-motion: reduce) {
  .scanlines { display: none; }
  body { text-shadow: none; }
}
```

- [ ] **Step 2: Update `index.html`**

Replace the generated `<head>` contents with a real title, description, and
theme colour, and set the favicon to nothing external:

```html
<title>Jennifer Duong — software engineer</title>
<meta name="description" content="Jennifer Duong's portfolio, as an interactive terminal." />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#0b0709" />
```

Delete the `<link rel="icon" href="/vite.svg" />` line and `public/vite.svg`.

- [ ] **Step 3: Verify it looks right**

```bash
npm run dev
```

Check by hand at http://localhost:5173:
- boot text appears, prompt reads `~ $`, cursor is pink
- `help`, `ls`, `cd projects`, `cat about.txt`, `tree`, `neofetch` all work
- clicking `projects` in `ls` output enters it; clicking a file cats it
- `cat ab` + Tab completes to `cat about.txt`
- ↑ recalls the previous command
- at 375px width the command chips appear and scroll
- with reduced motion enabled in OS settings, scanlines and glow disappear

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: pink-on-black terminal styling"
```

---

## Task 14: Remove the old site

The 2023 site is already tagged `v1-2023-site`, so this is recoverable with
`git checkout v1-2023-site`.

**Files:**
- Delete: `*.html` (root), `function.js`, `styles/*.css`, `styles/*.png`, `images/`, `fonts/`, `.vscode/`

- [ ] **Step 1: Confirm the tag exists before deleting anything**

```bash
git tag -l v1-2023-site
```

Expected: `v1-2023-site`. **If this prints nothing, stop** and create it with
`git tag v1-2023-site <commit-before-this-work>`.

- [ ] **Step 2: Remove the old files**

```bash
git rm -r --quiet about.html articles.html automata.html checkers.html contact.html \
  index.html pirate.html projects.html sudoku.html weather.html \
  function.js images fonts .vscode styles
```

Note this deletes the old root `index.html`. Vite's `index.html` is a different
file at the same path — Step 3 confirms it survived.

- [ ] **Step 3: Restore Vite's index.html if it was caught by the delete**

```bash
git status --short index.html
grep -q 'src/main.tsx' index.html && echo OK || echo "RESTORE NEEDED"
```

Expected: `OK`. If not, `git checkout HEAD -- index.html`.

- [ ] **Step 4: Verify the build still works**

```bash
npm run build && npm test
```

Expected: build succeeds, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: remove the 2023 site (preserved at tag v1-2023-site)"
```

---

## Task 15: Deploy to GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: Deploy to Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - id: deploy
        uses: actions/deploy-pages@v4
```

`npm test` runs before the build, so a broken command can never reach the live
site.

- [ ] **Step 2: Commit and push, including the tag**

```bash
git add .github && git commit -m "ci: deploy to github pages"
git push origin main --follow-tags
```

- [ ] **Step 3: Switch the Pages source — manual, cannot be scripted from here**

In GitHub: **Settings → Pages → Build and deployment → Source → GitHub Actions**.

Until this is changed, Pages keeps serving the old branch build and the new site
will not appear no matter how many times the workflow succeeds.

- [ ] **Step 4: Verify the deployment**

```bash
gh run watch
```

Then load https://jenduo.github.io/ and confirm the terminal boots, `help`
works, and clicking a filename works.

---

## Handover notes

Flag these to Jen when the work is done:

1. **`[TODO]` markers in `src/fs/tree.ts`** — the site is live with placeholder
   text in `about.txt`, `skills.txt`, `contact.txt` and `experience/investorhub.md`.
   Every one is inferred, not confirmed. They must be filled in or deleted.
2. **The contact email** — `contact.txt` deliberately does not ship her work
   address. It needs a personal one.
3. **`resume.pdf`** — drop the file in `public/` and set
   `href: '/resume.pdf'` on that node in `tree.ts`.
4. **`fleng-poketrack`** — no README, so no accurate description exists. Either
   she describes it or the directory comes out of `tree.ts`.
5. **Settings → Pages must be switched to GitHub Actions** (Task 15, Step 3).
