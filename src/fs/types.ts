import type { Line } from '../commands/types'
export interface Dir {
  kind: 'dir'
  name: string
  children: FsNode[]
  /**
   * Keep `children` in the order they are written instead of sorting them.
   *
   * Alphabetical is the right default for a filesystem, but meaningless for
   * things with a chronology: sorting jobs by name buries the current one in
   * the middle. Directories that opt in are authored newest first.
   */
  keepOrder?: boolean
}

export interface FileNode {
  kind: 'file'
  name: string
  /** Text shown by `cat`. Still required, so every file has a plain form. */
  body: string
  /**
   * Richer output for `cat` to use in place of `body`. Lets a file opt into
   * things plain text cannot express, such as inline logos, without making the
   * filesystem itself aware of any particular file.
   */
  lines?: Line[]
  /** When set, `open` navigates here. */
  href?: string
}

export type FsNode = Dir | FileNode
