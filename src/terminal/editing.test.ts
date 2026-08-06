import { describe, expect, it } from 'vitest'
import { deleteToEnd, deleteToStart, deleteWordBefore } from './editing'

describe('deleteToStart', () => {
  it('cuts everything before the caret and takes the caret with it', () => {
    expect(deleteToStart('cat experience', 4)).toEqual({ value: 'experience', caret: 0 })
  })

  it('does nothing at the start of the line', () => {
    expect(deleteToStart('cat', 0)).toEqual({ value: 'cat', caret: 0 })
  })
})

describe('deleteToEnd', () => {
  it('cuts from the caret on and leaves the caret where it was', () => {
    expect(deleteToEnd('cat experience', 4)).toEqual({ value: 'cat ', caret: 4 })
  })

  it('does nothing at the end of the line', () => {
    expect(deleteToEnd('cat', 3)).toEqual({ value: 'cat', caret: 3 })
  })
})

describe('deleteWordBefore', () => {
  it('cuts the word before the caret', () => {
    expect(deleteWordBefore('cat experience', 14)).toEqual({ value: 'cat ', caret: 4 })
  })

  // The space belongs to the word being removed, or a second press would stall
  // on the gap the first one made.
  it('takes the space before the word too', () => {
    expect(deleteWordBefore('cat experience ', 15)).toEqual({ value: 'cat ', caret: 4 })
  })

  it('eats one word per press, back to nothing', () => {
    let edit = deleteWordBefore('cd experience investorhub', 25)
    expect(edit.value).toBe('cd experience ')
    edit = deleteWordBefore(edit.value, edit.caret)
    expect(edit.value).toBe('cd ')
    edit = deleteWordBefore(edit.value, edit.caret)
    expect(edit.value).toBe('')
  })

  it('keeps what is after the caret', () => {
    expect(deleteWordBefore('cat skills', 4)).toEqual({ value: 'skills', caret: 0 })
  })

  it('does nothing at the start of the line', () => {
    expect(deleteWordBefore('cat', 0)).toEqual({ value: 'cat', caret: 0 })
  })
})
