/**
 * Writes the site's content into the built index.html, inside <noscript>.
 *
 * Before this, everything served was `<div id="root"></div>`. Every word lives in
 * JavaScript strings, and the terminal only prints a file when someone asks for
 * it, so even a crawler that runs JS saw the boot screen and nothing else: a
 * portfolio nobody could find by searching for what is in it. This also gives
 * anyone without JavaScript the whole thing as a plain document.
 *
 * The content is read from fs/tree.ts itself, never a copy, so the two cannot
 * drift. esbuild does the TypeScript, since that is the one thing plain node
 * cannot.
 */
import { build } from 'esbuild'
import { readFile, writeFile, rm } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const OUT = 'dist/index.html'
const BUNDLE = 'dist/.tree.mjs'

const escape = (text) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/**
 * Lines that only make sense at a prompt. `type 'open github' to see my repos`
 * is an instruction to a shell that is not running here, and the intro's `Try:`
 * line is a list of commands: both would read as nonsense in a document and as
 * keyword noise to a crawler.
 */
const isShellDirection = (row) => /^type '/.test(row) || /^Try:/.test(row)

/**
 * A file body as HTML, following the same markup the terminal renders: `#` is the
 * title, `##` the line beneath it, `- ` a bullet.
 */
function bodyHtml(body, headingLevel = 3) {
  const rows = body.split('\n').filter((row) => !isShellDirection(row))
  const out = []
  let list = null

  const flush = () => {
    if (!list) return
    out.push(`<ul>${list.join('')}</ul>`)
    list = null
  }

  for (const row of rows) {
    const title = row.match(/^#\s+(.*)$/)
    // The second line of a title card is its place and dates, which is metadata
    // rather than a heading of its own.
    const subtitle = row.match(/^##\s+(.*)$/)
    const bullet = row.match(/^-\s+(.*)$/)

    if (bullet) {
      list ??= []
      list.push(`<li>${escape(bullet[1])}</li>`)
      continue
    }
    flush()

    if (title) out.push(`<h${headingLevel}>${escape(title[1])}</h${headingLevel}>`)
    else if (subtitle) out.push(`<p>${escape(subtitle[1])}</p>`)
    else if (row.trim()) out.push(`<p>${escape(row)}</p>`)
  }

  flush()
  return out.join('\n')
}

/** Every directory as a section, every file as an article, in authored order. */
function treeHtml(dir) {
  return dir.children
    .map((child) => {
      if (child.kind === 'dir') {
        return `<section>\n<h2>${escape(child.name)}</h2>\n${treeHtml(child)}\n</section>`
      }

      // A file with a `# title` heads its article with it. Only the ones without
      // fall back to the filename, so nothing is titled twice.
      const heading = /^#\s/.test(child.body) ? '' : `<h3>${escape(child.name)}</h3>\n`
      const link = child.href
        ? `\n<p><a href="${escape(child.href)}">${escape(child.href)}</a></p>`
        : ''
      return `<article>\n${heading}${bodyHtml(child.body)}${link}\n</article>`
    })
    .join('\n')
}

await build({
  entryPoints: ['src/fs/tree.ts'],
  outfile: BUNDLE,
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  logLevel: 'warning',
})

const { root, intro } = await import(pathToFileURL(BUNDLE).href)
await rm(BUNDLE)

const noscript = [
  '<noscript>',
  '<h1>Jennifer Duong</h1>',
  bodyHtml(intro),
  treeHtml(root),
  '</noscript>',
].join('\n')

const html = await readFile(OUT, 'utf8')
if (html.includes('<noscript>')) throw new Error('index.html already carries a noscript block')
await writeFile(OUT, html.replace('</body>', `${noscript}\n</body>`))

const words = noscript.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
console.log(`prerender: ${words} words of content written into ${OUT}`)
