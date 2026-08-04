import { describe, expect, it } from 'vitest'
import { COMMANDS, runCommand } from './index'
import type { ShellContext } from './types'
import { fixtureRoot } from '../fs/fixture'

const ctx = (cwd = '/'): ShellContext => ({ root: fixtureRoot, cwd, history: [] })

const asText = (result: { lines: { type: string }[] }) =>
  result.lines.map((line) => ('text' in line ? String(line.text) : '')).join('\n')

describe('registry', () => {
  it('has no duplicate names', () => {
    const names = COMMANDS.map((command) => command.name)
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
  it('lists every visible command', () => {
    const output = asText(runCommand('help', ctx()))
    for (const command of COMMANDS.filter((c) => !c.hidden)) {
      expect(output, command.name).toContain(command.name)
    }
  })

  it('does not leak the easter eggs', () => {
    const output = asText(runCommand('help', ctx()))
    for (const command of COMMANDS.filter((c) => c.hidden)) {
      expect(output, command.name).not.toContain(command.name)
    }
  })
})

describe('runCommand', () => {
  it('echoes the input as a prompt line', () => {
    expect(runCommand('pwd', ctx()).lines[0]).toMatchObject({ type: 'prompt', input: 'pwd' })
  })

  it('emits only the prompt line for blank input', () => {
    expect(runCommand('   ', ctx()).lines).toHaveLength(1)
  })

  it('collapses runs of whitespace between arguments', () => {
    expect(runCommand('cd    alpha', ctx()).cwd).toBe('/alpha')
  })

  it('reports an unknown command', () => {
    const output = asText(runCommand('frobnicate', ctx()))
    expect(output).toContain('command not found')
  })

  it('suggests a near miss', () => {
    expect(asText(runCommand('sl', ctx()))).toContain("did you mean 'ls'")
  })

  it('does not suggest anything for a wild miss', () => {
    expect(asText(runCommand('frobnicate', ctx()))).toContain("type 'help'")
  })

  it('passes cwd changes through', () => {
    expect(runCommand('cd alpha', ctx()).cwd).toBe('/alpha')
  })

  it('passes clear through', () => {
    expect(runCommand('clear', ctx()).clear).toBe(true)
  })

  it('runs hidden commands even though help omits them', () => {
    expect(asText(runCommand('sudo rm', ctx()))).toContain('sudoers')
  })
})
