import type { Line } from '../commands/types'
export interface Dir {
  kind: 'dir'
  name: string
  children: FsNode[]
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
