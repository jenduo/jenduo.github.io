import type { Dir } from './types'

/**
 * A stable filesystem for tests.
 *
 * Command tests used to assert against the real content tree, which meant
 * every wording or filename change broke unrelated tests. This fixture exists
 * so those tests describe behaviour instead of describing Jen's CV.
 *
 * It deliberately covers: an extensionless file, a file with an extension, a
 * file with a link, one without, a nested directory, an empty directory, and
 * two files sharing a prefix for completion tests.
 *
 * `zulu` holds a single nested directory on purpose. `tree` prefixes the
 * children of a *last* entry with blank space and everything else with a guide
 * column, and at root the last entry is always a file (files sort after
 * directories), so the blank-space branch is only reachable by walking into a
 * directory whose only child is a directory.
 */
export const fixtureRoot: Dir = {
  kind: 'dir',
  name: '',
  children: [
    { kind: 'file', name: 'readme', body: 'line one\nline two\n' },
    { kind: 'file', name: 'notes.txt', body: 'notes\n' },
    { kind: 'file', name: 'nolink', body: 'nothing to open\n' },
    { kind: 'file', name: 'linked', body: 'has a link\n', href: 'https://example.com/linked' },
    {
      kind: 'dir',
      name: 'alpha',
      children: [
        {
          kind: 'dir',
          name: 'beta',
          children: [{ kind: 'file', name: 'deep', body: 'deep\n' }],
        },
        { kind: 'file', name: 'apple', body: 'apple\n' },
        // Names its neighbour the way a real body does, relative to this
        // directory, which is what the click has to cope with.
        { kind: 'file', name: 'hinted', body: "has a hint\n\ntype 'cat apple' to read it.\n" },
        { kind: 'file', name: 'apricot', body: 'apricot\n' },
      ],
    },
    { kind: 'dir', name: 'mid', children: [] },
    {
      kind: 'dir',
      name: 'zulu',
      children: [
        { kind: 'dir', name: 'inner', children: [{ kind: 'file', name: 'last', body: 'last\n' }] },
      ],
    },
  ],
}
