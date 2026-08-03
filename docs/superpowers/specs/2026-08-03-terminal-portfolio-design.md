# jenduo.github.io — Terminal Portfolio

**Date:** 2026-08-03
**Status:** Approved design, pending implementation plan

## Goal

Replace the 2023 hand-drawn scrapbook site with a professional portfolio that
positions Jennifer Duong as a software engineer. The entire site is a single
interactive terminal: visitors explore her background by running shell commands
against a virtual filesystem.

The site itself is the primary work sample. It must survive a hiring manager who
has never opened a shell.

## Non-goals

- No blog or CMS. Content is code.
- No router, no multiple pages, no server.
- Nothing from the old site is carried forward. The 2023 site is preserved in git
  history and tagged `v1-2023-site` before being removed.

## Architecture

Vite + React + TypeScript, built to static assets and served by GitHub Pages.

Four layers, each independently testable:

| Layer | Location | Responsibility | Depends on |
|---|---|---|---|
| Content | `src/fs/tree.ts` | The virtual filesystem and every word of prose on the site | `fs/types` |
| Filesystem | `src/fs/resolve.ts` | Path resolution and node lookup | `fs/types` |
| Commands | `src/commands/*` | One module per command; pure functions from args + shell state to output | `fs/*` |
| Shell UI | `src/terminal/*` | Keyboard input, line rendering, history, autocomplete | `commands/*` |

The dependency graph points one way only. Content never imports command code, and
commands never touch the DOM. Adding a command means adding one file and one
registry entry; updating the site's text means editing `tree.ts` and nothing else.

### Virtual filesystem

A discriminated union, deliberately minimal:

```ts
type FsNode = Dir | File
type Dir  = { kind: 'dir';  name: string; children: FsNode[] }
type File = { kind: 'file'; name: string; body: string; href?: string }
```

`href` marks a node that `open` sends to a real URL. No permissions, no mtimes, no
symlinks — the shell is a browsing metaphor, not a POSIX emulator.

Layout:

```
~/
├── about.txt
├── skills.txt
├── contact.txt
├── resume.pdf              (href — placeholder until uploaded)
├── experience/
│   └── investorhub.md
└── projects/
    ├── asx-company-info/   {README.md, stack.txt}
    ├── mfbo-framework/     {README.md, stack.txt}
    └── fleng-poketrack/    {README.md, stack.txt}
```

### Path resolution

`resolve(cwd, input) -> FsNode | null` handles absolute paths, `~`, `.`, `..`,
redundant separators, and refuses to escape the root. This is the only genuinely
error-prone logic in the project, so it is specified by unit tests before it is
written.

### Command contract

```ts
type CommandResult = { lines: Line[]; cwd?: string; clear?: boolean }
type Command = (args: string[], ctx: ShellContext) => CommandResult
```

Commands return data, never render. A command that wants to change directory
returns a new `cwd`; the shell applies it. This keeps every command testable
without a DOM.

Commands: `help` `ls` `cd` `cat` `pwd` `tree` `open` `clear` `whoami` `history`
`echo` `date` `neofetch`. Easter eggs: `sudo`, `rm -rf /`, `exit`.

Unknown input produces `jsh: command not found: <cmd>` plus a nearest-match
suggestion by edit distance.

## Discoverability

The concept fails if a non-technical visitor stalls at an empty prompt. Four
affordances, in order of importance:

1. The boot sequence ends with a persistent hint: `type 'help' to look around`.
2. Every path in `ls` and `tree` output is a button. Clicking a directory runs
   `cd` into it; clicking a file runs `cat` on it. The whole site is reachable by
   clicking alone — typing is the enthusiast path, not the required one.
3. Tab completes commands and paths; ↑/↓ walk history.
4. On viewports under 640px, a horizontally scrolling row of command chips sits
   above the input, because typing `cd projects/` on a phone keyboard is a
   reason to leave.

## Visual design

Pink on near-black — a terminal that is recognisably hers rather than a default
green-on-black.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0b0709` | page, faintly warm black |
| `--fg` | `#ffa6c9` | body output |
| `--fg-dim` | `#8a5f72` | secondary text, comments, chrome |
| `--accent` | `#ff3d8a` | prompt, directories, focus |
| `--bright` | `#f5e6ed` | emphasis, headings inside files |

System monospace stack, no webfont — one less network dependency and no layout
shift. Texture comes from a faint scanline overlay, a soft text glow, and a
blinking block cursor. The boot sequence types itself out on load.

All motion — boot typing, cursor blink, scanlines — is disabled under
`prefers-reduced-motion`. The page is usable with animation off.

## Content

Written from her real repositories, with `[TODO]` markers on anything unverified
so the placeholders are impossible to ship by accident:

- **asx-company-info** — TypeScript. ASX company comparison tool: saved
  comparisons backed by SQL, shareable via query URL, ticker validation.
- **mfbo-framework** — Python. Multi-fidelity Bayesian optimization over
  Forrester, Branin, Borehole and Hartmann benchmarks; `EI`/`PI`/`UCB`/`KG`
  acquisition functions; BoTorch, run on HPC.
- **fleng-poketrack** — JavaScript. `[TODO: description]`
- **about.txt**, **experience/investorhub.md**, **skills.txt** — scaffolded with
  `[TODO]` markers. No invented employers, dates, titles, or claims.
- **resume.pdf** — `open` reports it is not uploaded yet until a real file lands
  in `public/`.

## Testing

Vitest, targeting the logic that can silently break:

- `resolve.ts` — absolute, relative, `~`, `..` past root, trailing slashes,
  missing nodes.
- Each command — output shape for valid input, error text for bad input, `cd`
  returning a new `cwd`, `ls` on a file versus a directory.
- Registry — every command in `help` exists, and every command is in `help`.

The shell UI is verified by hand in a browser: boot, type, click, tab-complete,
mobile width, reduced motion.

## Deployment

`.github/workflows/deploy.yml` builds on push to `main` and publishes to Pages.
Vite `base: '/'`, correct for a user site served from the domain root.

One manual step, which cannot be automated from here: the repository's Pages
source must be switched from branch to **GitHub Actions** in Settings → Pages.

## Risks

| Risk | Mitigation |
|---|---|
| Visitor sees a prompt and leaves | Clickable output; `help` hint in the boot text |
| Old site lost | Tag `v1-2023-site` before deleting anything |
| Placeholder text ships as fact | `[TODO]` markers, called out at handover |
| Pages serves a stale branch build | Flag the Settings → Pages switch explicitly |
