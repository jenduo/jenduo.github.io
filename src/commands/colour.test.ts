import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { colour } from './colour'
import { THEMES, isTheme } from './themes'
import type { ShellContext } from './types'
import { fixtureRoot } from '../fs/fixture'

const ctx: ShellContext = { root: fixtureRoot, cwd: '/', history: [] }
const asText = (lines: { type: string }[]) =>
  lines.map((line) => ('text' in line ? String(line.text) : '')).join('\n')

describe('isTheme', () => {
  it('accepts every offered theme', () => {
    for (const theme of THEMES) expect(isTheme(theme), theme).toBe(true)
  })

  it('rejects anything else', () => {
    for (const value of ['red', 'PINK', '', 'blue ', 'rainbow']) {
      expect(isTheme(value), JSON.stringify(value)).toBe(false)
    }
  })
})

describe('colour', () => {
  it('sets a valid theme', () => {
    const result = colour(['green'], ctx)
    expect(result.theme).toBe('green')
    expect(asText(result.lines)).toContain('green')
  })

  it('sets no theme and lists the options when given nothing', () => {
    const result = colour([], ctx)
    expect(result.theme).toBeUndefined()
    for (const theme of THEMES) expect(asText(result.lines), theme).toContain(theme)
  })

  it('refuses an unknown colour and says what is available', () => {
    const result = colour(['orange'], ctx)
    expect(result.theme).toBeUndefined()
    expect(result.lines[0]).toMatchObject({ tone: 'error' })
    expect(asText(result.lines)).toContain('pink')
  })

  it('is case sensitive, rather than quietly accepting near misses', () => {
    expect(colour(['Green'], ctx).theme).toBeUndefined()
  })
})

describe('themes and stylesheet agree', () => {
  const css = readFileSync('src/styles/terminal.css', 'utf8')

  // Offering a theme with no CSS behind it would silently do nothing at all.
  it('has a palette in the stylesheet for every theme but the default', () => {
    for (const theme of THEMES) {
      if (theme === 'pink') continue
      expect(css, theme).toContain(`[data-theme='${theme}']`)
    }
  })

  it('keeps pink as the default palette rather than a data-theme block', () => {
    expect(css).not.toContain("[data-theme='pink']")
    expect(css).toMatch(/:root\s*\{[^}]*--accent:\s*#ff3d8a/)
  })

  it('never lets a palette recolour --error into the theme', () => {
    const blocks = css.match(/\[data-theme='[a-z]+'\]\s*\{[^}]*\}/g) ?? []
    expect(blocks.length).toBe(THEMES.length - 1)
    for (const block of blocks) expect(block).not.toContain('--error')
  })
})
