export interface Dir {
  kind: 'dir'
  name: string
  children: FsNode[]
}

export interface FileNode {
  kind: 'file'
  name: string
  /** Text shown by `cat`. */
  body: string
  /** When set, `open` navigates here. */
  href?: string
}

export type FsNode = Dir | FileNode
