# Working on this site

Read `README.md` first for the architecture. This file is only the things that
are not visible in the code: Jen's preferences, what is still unfinished, and the
traps that have already cost time once.

## House rules

- **No em dashes.** Anywhere. Not in site copy, comments, commit messages or
  chat. Use a comma, a colon, or two sentences.
- **Never `git push` unless Jen asks.** Commit locally as you go; the pushing is
  her call. Check `git log origin/main..HEAD` to see what is waiting.
- **Ask in plain prose, not multiple choice.** No option lists.
- **All prose lives in `src/fs/tree.ts`.** One file. If you are editing content
  anywhere else, you are in the wrong place.
- **Every linked file ends with `type 'open <name>' to <do the thing>.`** One
  wording for the whole site, with the name as the visitor would type it from
  that directory. `tree.test.ts` enforces both the form and that the name still
  resolves, so a rename cannot leave a hint pointing at nothing. The wording is
  load-bearing beyond style: `asHint` in `commands/types.ts` matches it and turns
  the quoted command into a button, so a hint phrased any other way silently
  stops being clickable.
- **Typing and clicking are deliberately not the same.** Typed paths resolve
  against the working directory, like a real shell: `open article` from `~` fails
  and offers `try 'open ~/publications/article'`. Clicking always works, because
  `bindHints` rewrites the click to the full path while leaving the text short.
  Jen chose this so the site does not teach people a shell that does not exist.
  Do not "fix" the typed case by making it lenient.
- **Two hues, and they mean different things.** `--accent` is structure and
  identity: headings, prompts, directory names, the grid on the desk. `--second`
  is what a visitor can act on: runnable commands, the mobile chips, the accept
  key, a URL that was followed, and the light on the desk. Every palette defines
  both, so `colour` carries the distinction. Adding a third colour, or reaching
  for `--accent` on something clickable, undoes it.
- Verify visual changes by measuring in the browser (`agent-browser`), not by
  reasoning about CSS. Several bugs below were found only that way.
- Use `agent-browser`, never the Claude-for-Chrome tools. They are denied.

## Still to do

The content pass is unfinished. Everything below is my wording, not Jen's, and
she is going through it section by section. `experience/investorhub` is done and
is the model to follow: `# Place · Role` on the title line, `## Location · Dates`
beneath, then straight into bullets of what she actually built. She cut the
company-explainer sentence from that entry, so do not reintroduce one elsewhere:
the site is about her work, not her employers.

Fill in as you go with her:

- [ ] `experience/unimelb-csl` — bullets are accurate but never reviewed with her
- [ ] `experience/allmediadesk` — thin, three bullets
- [x] `publications/` — done. Two entries, named by what they are:
      `conference-paper` (ACM BCB '26, Jen is first author, so it leads and the
      author line says so) and `article` (BioProcess International). An entry is
      a short summary and a link, nothing more: no tech stack line, no link to
      the code. Jen cut a third, the CHO preprint, rather than fill it out.
- [ ] `education`, `skills`, `contact/*` — never reviewed with her
- [ ] `other/volunteer` — never reviewed, and the only thing left in `other/`.
      Jen cut `this-site`, which described how the site was built; do not write
      another one. If `volunteer` goes too, drop the directory rather than
      leaving an empty one.

### Open questions for her

- `whoami` says "software engineer in Melbourne" while `experience/investorhub`
  says "Junior Software Engineer". Deliberate for now: the intro is a
  self-description, the card is a job title. She knows and left it.
- **`public/resume.pdf` has a References page**, so two referees' emails and a
  phone number are on the public internet right now. She has not decided whether
  to swap in a version without it. Raise it, do not act unilaterally.

### Offered, not yet delivered

- The InvestorHub logo, to sit beside that heading. Duotone it to match
  `public/jen.jpg` (see the image pipeline below).
- More photos. Same pipeline. Flag any third parties or identifying background
  before wiring one in.

### Housekeeping

- `deploy.yml` pins `node-version: 20`, which now warns. Bump to 24.

## Traps

**GitHub Pages source must stay "GitHub Actions".** It was previously "Deploy
from a branch", which serves the raw repo. Vite's `index.html` points at
`/src/main.tsx`, so a raw-branch deploy 404s and the site goes blank. Check
Settings → Pages before anything that touches deployment.

**Overlay scrollbars cannot be styled.** `::-webkit-scrollbar` reserves zero
width and is ignored outright once `scrollbar-color` is set. That is why
`src/terminal/Scrollbar.tsx` exists. Do not try to replace it with CSS; it was
measured, not assumed.

**`.scrollarea` is a flex row and order matters.** `<Scrollbar>` must come after
the scrollback or the column renders down the left-hand side.

**Case-insensitive filesystem.** `Scrollbar.tsx` and `scrollbar.ts` collide,
which is why the geometry module is `scrollGeometry.ts`. After renaming a module,
`rm -rf node_modules/.vite` and restart, or Vite serves the stale one and the app
silently fails to mount while `tsc` and `npm run build` both still pass.

**The ASCII banner needs loose leading** (line-height 1.5). Tight leading looks
right in theory and is illegible in practice. Compare in the browser before
changing it.

**Bodies in `tree.ts` are authored unwrapped**, one long line per paragraph, with
no leading spaces. Wrapping and indentation are the stylesheet's job. Hard
wrapping the source fixes the measure at whatever width you guessed.

**Anything derived from the filesystem must be derived, not copied.** The boot
entry list was once hand-written and silently drifted, hiding `education` and
`resume.pdf`. `ls`, `tree` and the toolbar all go through `entriesOf`.

## Before you commit

`npx tsc -b && npm test && npm run build`. 152 tests as of the last commit; the
count only goes up. Check both 390px and 1280px widths for anything visual, and
remember mobile has no scroll column by design.
