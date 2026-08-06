import { describe, expect, it } from 'vitest'
import { excerpt, grep, searchTree } from './search'
import { fixtureRoot } from '../fs/fixture'
import type { Dir } from '../fs/types'
import type { ShellContext } from './types'

const ctx = (cwd = '/'): ShellContext => ({ root: fixtureRoot, cwd, history: [] })

const paragraph =
  'Optimising a biological process means expensive experiments, while cheaper sources like mechanistic models sit unused because nobody trusts them.'

describe('excerpt', () => {
  it('returns a short line whole', () => {
    expect(excerpt('apple', 'apple')).toBe('apple')
  })

  // Bodies are one long line per paragraph, so grep's own behaviour of printing
  // the matching line would print the entire paragraph.
  it('windows a long line around the hit', () => {
    const out = excerpt(paragraph, 'mechanistic')
    expect(out).toContain('mechanistic')
    expect(out.length).toBeLessThan(paragraph.length)
  })

  it('marks the ends it cut, and only those', () => {
    expect(excerpt(paragraph, 'mechanistic').startsWith('…')).toBe(true)
    expect(excerpt(paragraph, 'Optimising').startsWith('…')).toBe(false)
    expect(excerpt(paragraph, 'them').endsWith('…')).toBe(false)
  })

  it('does not cut mid-word', () => {
    const out = excerpt(paragraph, 'mechanistic').replace(/…/g, '')
    for (const word of out.split(' ')) {
      expect(paragraph.split(/\s+/), word).toContain(word.replace(/[.,]$/, ''))
    }
  })

  // The markers are instructions to the renderer, not part of the prose.
  it('strips heading and bullet markup', () => {
    expect(excerpt('# InvestorHub', 'investorhub')).toBe('InvestorHub')
    expect(excerpt('- Built a thing', 'built')).toBe('Built a thing')
  })
})

describe('searchTree', () => {
  it('finds a word in a body, wherever it is nested', () => {
    const [match] = searchTree(fixtureRoot, '/', 'deep')
    expect(match.path).toBe('/alpha/beta/deep')
  })

  it('is case-insensitive', () => {
    expect(searchTree(fixtureRoot, '/', 'APPLE')).toEqual(searchTree(fixtureRoot, '/', 'apple'))
    expect(searchTree(fixtureRoot, '/', 'APPLE').length).toBeGreaterThan(0)
  })

  it('matches a filename even when the body says nothing', () => {
    const match = searchTree(fixtureRoot, '/', 'nolink')
    expect(match).toHaveLength(1)
    expect(match[0].excerpts).toEqual([])
  })

  it('finds nothing for a word that is nowhere', () => {
    expect(searchTree(fixtureRoot, '/', 'zebra')).toEqual([])
  })

  // Otherwise one wordy file could bury every other result.
  it('caps the excerpts per file and counts the rest', () => {
    const wordy: Dir = {
      kind: 'dir',
      name: '',
      children: [{ kind: 'file', name: 'many', body: Array(7).fill('a hit here').join('\n') }],
    }
    const [match] = searchTree(wordy, '/', 'hit')
    expect(match.excerpts).toHaveLength(3)
    expect(match.extra).toBe(4)
  })

  it('reports paths that are clickable from anywhere, not names', () => {
    expect(searchTree(fixtureRoot, '/', 'deep')[0].path.startsWith('/')).toBe(true)
  })
})

describe('grep', () => {
  it('requires something to look for', () => {
    expect(grep([], ctx()).lines[0]).toMatchObject({ text: 'usage: grep <text>' })
  })

  // The whole line is the pattern, so a phrase does not become a stray argument.
  it('searches for a phrase, not just the first word', () => {
    const hit = grep(['line', 'two'], ctx()).lines.some(
      (line) => line.type === 'paths' && line.entries[0].path === '/readme',
    )
    expect(hit).toBe(true)
  })

  it('says so plainly when nothing matches', () => {
    const [line] = grep(['zebra'], ctx()).lines
    expect(line.type === 'text' && line.text).toContain('nothing matches')
  })

  // Searching from a subdirectory still searches everything: a portfolio visitor
  // wants the answer, not a lesson about their working directory.
  it('finds the same results from anywhere in the tree', () => {
    const here = grep(['deep'], ctx('/')).lines.length
    expect(grep(['deep'], ctx('/mid')).lines).toHaveLength(here)
  })

  it('leads with a count, so a long list is not a surprise', () => {
    const [line] = grep(['a'], ctx()).lines
    expect(line.type === 'text' && line.text).toMatch(/^\d+ files? matching/)
  })

  it('makes every result a clickable path', () => {
    const paths = grep(['apple'], ctx()).lines.filter((line) => line.type === 'paths')
    expect(paths.length).toBeGreaterThan(0)
  })
})
