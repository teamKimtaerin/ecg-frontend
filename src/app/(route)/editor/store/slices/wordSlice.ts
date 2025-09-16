import { StateCreator } from 'zustand'

export interface AnimationTrack {
  assetId: string
  assetName: string
  timing: { start: number; end: number }
  intensity: { min: number; max: number }
  color: 'blue' | 'green' | 'purple'
}

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
  // New state for inline editing and detail editor
  editingWordId: string | null
  editingClipId: string | null
  wordDetailOpen: boolean
  expandedClipId: string | null // For expanded waveform view
  expandedWordId: string | null // Which word triggered the expansion
  wordTimingAdjustments: Map<string, { start: number; end: number }>
  wordAnimationIntensity: Map<string, { min: number; max: number }>
  // Undo/Redo history for word timing
  wordTimingHistory: Map<string, Array<{ start: number; end: number }>>
  wordTimingHistoryIndex: Map<string, number>
  // Animation tracks per word (max 3 tracks)
  wordAnimationTracks: Map<string, AnimationTrack[]>
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

  // Inline editing and detail editor
  startInlineEdit: (clipId: string, wordId: string) => void
  endInlineEdit: () => void
  openWordDetailEditor: (clipId: string, wordId: string) => void
  closeWordDetailEditor: () => void
  expandClip: (clipId: string, wordId: string) => void
  collapseClip: () => void
  updateWordTiming: (wordId: string, start: number, end: number) => void
  updateAnimationIntensity: (wordId: string, min: number, max: number) => void
  undoWordTiming: (wordId: string) => void
  redoWordTiming: (wordId: string) => void

  // Animation tracks
  addAnimationTrack: (
    wordId: string,
    assetId: string,
    assetName: string,
    wordTiming?: { start: number; end: number }
  ) => void
  removeAnimationTrack: (wordId: string, assetId: string) => void
  updateAnimationTrackTiming: (
    wordId: string,
    assetId: string,
    start: number,
    end: number
  ) => void
  updateAnimationTrackIntensity: (
    wordId: string,
    assetId: string,
    min: number,
    max: number
  ) => void
  clearAnimationTracks: (wordId: string) => void

  // Utility
  isWordFocused: (wordId: string) => boolean
  isWordInGroup: (wordId: string) => boolean
  canDragWord: (wordId: string) => boolean
  isEditingWord: (wordId: string) => boolean
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
  editingWordId: null,
  editingClipId: null,
  wordDetailOpen: false,
  expandedClipId: null,
  expandedWordId: null,
  wordTimingAdjustments: new Map(),
  wordAnimationIntensity: new Map(),
  wordTimingHistory: new Map(),
  wordTimingHistoryIndex: new Map(),
  wordAnimationTracks: new Map(),

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

  // Inline editing and detail editor
  startInlineEdit: (clipId, wordId) =>
    set({
      editingWordId: wordId,
      editingClipId: clipId,
    }),

  endInlineEdit: () =>
    set({
      editingWordId: null,
      editingClipId: null,
    }),

  openWordDetailEditor: (clipId, wordId) =>
    set({
      wordDetailOpen: true,
      focusedWordId: wordId,
      focusedClipId: clipId,
    }),

  closeWordDetailEditor: () =>
    set({
      wordDetailOpen: false,
    }),

  expandClip: (clipId, wordId) =>
    set({
      expandedClipId: clipId,
      expandedWordId: wordId,
      wordDetailOpen: false, // Close modal if open
    }),

  collapseClip: () =>
    set({
      expandedClipId: null,
      expandedWordId: null,
    }),

  updateWordTiming: (wordId, start, end) =>
    set((state) => {
      const newTimings = new Map(state.wordTimingAdjustments)
      newTimings.set(wordId, { start, end })

      // Add to history
      const history = state.wordTimingHistory.get(wordId) || []
      const historyIndex = state.wordTimingHistoryIndex.get(wordId) || 0

      // Remove any future history if we're not at the end
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push({ start, end })

      // Limit history to 50 items
      if (newHistory.length > 50) {
        newHistory.shift()
      }

      const newWordHistory = new Map(state.wordTimingHistory)
      const newHistoryIndex = new Map(state.wordTimingHistoryIndex)
      newWordHistory.set(wordId, newHistory)
      newHistoryIndex.set(wordId, newHistory.length - 1)

      return {
        wordTimingAdjustments: newTimings,
        wordTimingHistory: newWordHistory,
        wordTimingHistoryIndex: newHistoryIndex,
      }
    }),

  updateAnimationIntensity: (wordId, min, max) =>
    set((state) => {
      const newIntensity = new Map(state.wordAnimationIntensity)
      newIntensity.set(wordId, { min, max })
      return { wordAnimationIntensity: newIntensity }
    }),

  undoWordTiming: (wordId) =>
    set((state) => {
      const history = state.wordTimingHistory.get(wordId)
      const currentIndex = state.wordTimingHistoryIndex.get(wordId)

      if (!history || currentIndex === undefined || currentIndex <= 0) {
        return state // Nothing to undo
      }

      const newIndex = currentIndex - 1
      const previousTiming = history[newIndex]

      const newTimings = new Map(state.wordTimingAdjustments)
      const newHistoryIndex = new Map(state.wordTimingHistoryIndex)

      newTimings.set(wordId, previousTiming)
      newHistoryIndex.set(wordId, newIndex)

      return {
        wordTimingAdjustments: newTimings,
        wordTimingHistoryIndex: newHistoryIndex,
      }
    }),

  redoWordTiming: (wordId) =>
    set((state) => {
      const history = state.wordTimingHistory.get(wordId)
      const currentIndex = state.wordTimingHistoryIndex.get(wordId)

      if (
        !history ||
        currentIndex === undefined ||
        currentIndex >= history.length - 1
      ) {
        return state // Nothing to redo
      }

      const newIndex = currentIndex + 1
      const nextTiming = history[newIndex]

      const newTimings = new Map(state.wordTimingAdjustments)
      const newHistoryIndex = new Map(state.wordTimingHistoryIndex)

      newTimings.set(wordId, nextTiming)
      newHistoryIndex.set(wordId, newIndex)

      return {
        wordTimingAdjustments: newTimings,
        wordTimingHistoryIndex: newHistoryIndex,
      }
    }),

  // Animation tracks
  addAnimationTrack: (wordId, assetId, assetName, wordTiming) =>
    set((state) => {
      const newTracks = new Map(state.wordAnimationTracks)
      const existingTracks = newTracks.get(wordId) || []

      // Check if already exists or if we've reached max (3)
      if (
        existingTracks.find((t) => t.assetId === assetId) ||
        existingTracks.length >= 3
      ) {
        return state
      }

      // Assign color based on current track count
      const colors: ('blue' | 'green' | 'purple')[] = [
        'blue',
        'green',
        'purple',
      ]
      const color = colors[existingTracks.length]

      // Use provided wordTiming or get from adjustments or default
      const timing = wordTiming ||
        state.wordTimingAdjustments.get(wordId) || { start: 0, end: 1 }

      const newTrack: AnimationTrack = {
        assetId,
        assetName,
        timing: { ...timing },
        intensity: { min: 0.3, max: 0.7 },
        color,
      }

      newTracks.set(wordId, [...existingTracks, newTrack])
      return { wordAnimationTracks: newTracks }
    }),

  removeAnimationTrack: (wordId, assetId) =>
    set((state) => {
      const newTracks = new Map(state.wordAnimationTracks)
      const existingTracks = newTracks.get(wordId) || []

      const filteredTracks = existingTracks.filter((t) => t.assetId !== assetId)

      // Reassign colors after removal
      const colors: ('blue' | 'green' | 'purple')[] = [
        'blue',
        'green',
        'purple',
      ]
      const recoloredTracks = filteredTracks.map((track, index) => ({
        ...track,
        color: colors[index],
      }))

      if (recoloredTracks.length === 0) {
        newTracks.delete(wordId)
      } else {
        newTracks.set(wordId, recoloredTracks)
      }

      return { wordAnimationTracks: newTracks }
    }),

  updateAnimationTrackTiming: (wordId, assetId, start, end) =>
    set((state) => {
      const newTracks = new Map(state.wordAnimationTracks)
      const existingTracks = newTracks.get(wordId) || []

      const updatedTracks = existingTracks.map((track) =>
        track.assetId === assetId ? { ...track, timing: { start, end } } : track
      )

      newTracks.set(wordId, updatedTracks)
      return { wordAnimationTracks: newTracks }
    }),

  updateAnimationTrackIntensity: (wordId, assetId, min, max) =>
    set((state) => {
      const newTracks = new Map(state.wordAnimationTracks)
      const existingTracks = newTracks.get(wordId) || []

      const updatedTracks = existingTracks.map((track) =>
        track.assetId === assetId
          ? { ...track, intensity: { min, max } }
          : track
      )

      newTracks.set(wordId, updatedTracks)
      return { wordAnimationTracks: newTracks }
    }),

  clearAnimationTracks: (wordId) =>
    set((state) => {
      const newTracks = new Map(state.wordAnimationTracks)
      newTracks.delete(wordId)
      return { wordAnimationTracks: newTracks }
    }),

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

  isEditingWord: (wordId) => {
    const state = get()
    return state.editingWordId === wordId
  },
})
