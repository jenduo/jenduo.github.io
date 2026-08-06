/**
 * Line editing, the readline way.
 *
 * Anyone who reaches for Ctrl+W in a terminal does it without thinking, so the
 * shell has to answer. These are the parts worth testing: where the caret lands
 * is as much of the behaviour as what is left of the text.
 */
export interface Edit {
  value: string
  caret: number
}

/** Ctrl+U: everything before the caret goes. */
export function deleteToStart(value: string, caret: number): Edit {
  return { value: value.slice(caret), caret: 0 }
}

/** Ctrl+K: everything from the caret on goes. */
export function deleteToEnd(value: string, caret: number): Edit {
  return { value: value.slice(0, caret), caret }
}

/**
 * Ctrl+W: the word before the caret goes, along with any space between.
 *
 * Whitespace first, then the run of non-whitespace, which is what makes a second
 * press eat the next word rather than stalling on the gap it just made.
 */
export function deleteWordBefore(value: string, caret: number): Edit {
  let cut = caret
  while (cut > 0 && /\s/.test(value[cut - 1])) cut -= 1
  while (cut > 0 && !/\s/.test(value[cut - 1])) cut -= 1
  return { value: value.slice(0, cut) + value.slice(caret), caret: cut }
}
