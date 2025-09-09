import { StateCreator } from 'zustand'

export interface WordDragState {
  focusedWordId: string | null
  focusedClipId: string | null
  groupedWordIds: Set<string>
  isDraggingWord: boolean
  draggedWordId: string | null
  dropTargetWordId: string | null
  dropPosition: 'before' | 'after' | null
  isGroupSelecting: boolean
  groupSelectionStart: { clipId: string; wordId: string } | null
}

export interface WordSlice extends WordDragState {
  // Focus management
  setFocusedWord: (clipId: string, wordId: string | null) => void
  clearWordFocus: () => void

  // Group selection
  startGroupSelection: (clipId: string, wordId: string) => void
  addToGroupSelection: (wordId: string) => void
  endGroupSelection: () => void
  clearGroupSelection: () => void
  toggleWordInGroup: (wordId: string) => void

  // Drag and drop
  startWordDrag: (wordId: string) => void
  endWordDrag: () => void
  setDropTarget: (
    wordId: string | null,
    position: 'before' | 'after' | null
  ) => void

  // Word reordering
  reorderWords: (
    clipId: string,
    sourceWordId: string,
    targetWordId: string,
    position: 'before' | 'after'
  ) => void

  // Utility
  isWordFocused: (wordId: string) => boolean
  isWordInGroup: (wordId: string) => boolean
  canDragWord: (wordId: string) => boolean
}

export const createWordSlice: StateCreator<WordSlice, [], [], WordSlice> = (
  set,
  get
) => ({
  // Initial state
  focusedWordId: null,
  focusedClipId: null,
  groupedWordIds: new Set(),
  isDraggingWord: false,
  draggedWordId: null,
  dropTargetWordId: null,
  dropPosition: null,
  isGroupSelecting: false,
  groupSelectionStart: null,

  // Focus management
  setFocusedWord: (clipId, wordId) =>
    set({
      focusedClipId: clipId,
      focusedWordId: wordId,
      groupedWordIds: wordId ? new Set([wordId]) : new Set(),
    }),

  clearWordFocus: () =>
    set({
      focusedWordId: null,
      focusedClipId: null,
      groupedWordIds: new Set(),
    }),

  // Group selection
  startGroupSelection: (clipId, wordId) =>
    set({
      isGroupSelecting: true,
      groupSelectionStart: { clipId, wordId },
      groupedWordIds: new Set([wordId]),
      focusedClipId: clipId,
    }),

  addToGroupSelection: (wordId) =>
    set((state) => ({
      groupedWordIds: new Set([...state.groupedWordIds, wordId]),
    })),

  endGroupSelection: () =>
    set({
      isGroupSelecting: false,
      groupSelectionStart: null,
    }),

  clearGroupSelection: () =>
    set({
      groupedWordIds: new Set(),
      isGroupSelecting: false,
      groupSelectionStart: null,
    }),

  toggleWordInGroup: (wordId) =>
    set((state) => {
      const newGroup = new Set(state.groupedWordIds)
      if (newGroup.has(wordId)) {
        newGroup.delete(wordId)
      } else {
        newGroup.add(wordId)
      }
      return { groupedWordIds: newGroup }
    }),

  // Drag and drop
  startWordDrag: (wordId) =>
    set((state) => {
      // Only allow dragging if the word is focused or in group
      if (state.focusedWordId === wordId || state.groupedWordIds.has(wordId)) {
        return {
          isDraggingWord: true,
          draggedWordId: wordId,
        }
      }
      return state
    }),

  endWordDrag: () =>
    set({
      isDraggingWord: false,
      draggedWordId: null,
      dropTargetWordId: null,
      dropPosition: null,
    }),

  setDropTarget: (wordId, position) =>
    set({
      dropTargetWordId: wordId,
      dropPosition: position,
    }),

  // Word reordering (to be implemented with clip store integration)
  reorderWords: (clipId, sourceWordId, targetWordId, position) => {
    // This will be integrated with the clip store to update word order
    // and reconstruct the full text
    console.log('Reordering words:', {
      clipId,
      sourceWordId,
      targetWordId,
      position,
    })
  },

  // Utility functions
  isWordFocused: (wordId) => {
    const state = get()
    return state.focusedWordId === wordId
  },

  isWordInGroup: (wordId) => {
    const state = get()
    return state.groupedWordIds.has(wordId)
  },

  canDragWord: (wordId) => {
    const state = get()
    return state.focusedWordId === wordId || state.groupedWordIds.has(wordId)
  },
})
