# jenduo.github.io

My portfolio, built as an interactive terminal. Visitors explore it with real
shell commands (`ls`, `cd`, `cat`, `tree`) or by clicking any filename, so it
works whether or not you live in a shell.

Live at [jenduo.github.io](https://jenduo.github.io/).

## Editing the content

**All of the site's prose lives in one file: `src/fs/tree.ts`.** Edit there and
nowhere else to change what the site says. Nothing in the shell engine needs to
know about content.

Any `[TODO]` markers in that file are unverified placeholders. They are meant to
be visible, so they cannot ship as fact by accident.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # path resolution + every command
npm run build    # static output in dist/
```

## How it is put together

Four layers, each depending only on the one above it.

| Layer | Location | Responsibility |
|---|---|---|
| Content | `src/fs/tree.ts` | The virtual filesystem and all prose |
| Filesystem | `src/fs/resolve.ts` | Path normalization and node lookup |
| Commands | `src/commands/` | One module per command, pure functions |
| Shell UI | `src/terminal/` | Keyboard input, rendering, history, completion |

Commands return data and never touch the DOM, which is why they are testable
without a browser. `cd` returns a new working directory rather than mutating
one. `help` is generated from the command registry, so it cannot drift out of
sync with what actually exists.

To add a command: write it in `src/commands/`, add one entry to the registry in
`src/commands/index.ts`. It appears in `help` automatically.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which tests, builds,
and publishes to GitHub Pages. The repository's Pages source must be set to
**GitHub Actions** (Settings → Pages).

## History

The previous hand-drawn version of this site (2023) is preserved at the tag
`v1-2023-site`:

```bash
git checkout v1-2023-site
```
