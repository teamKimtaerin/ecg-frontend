import { StateCreator } from 'zustand'
import { getPluginTimeOffset } from '../../utils/pluginManifestLoader'
import { Word, ClipItem } from '../../types'

export interface AnimationTrack {
  assetId: string
  assetName: string
  pluginKey?: string
  params?: Record<string, unknown>
  timing: { start: number; end: number }
  intensity: { min: number; max: number }
  color: 'blue' | 'green' | 'purple'
  timeOffset?: [number, number] // [preOffset, postOffset] from plugin manifest
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
  // Multi-selection state
  lastSelectedWordId: string | null
  lastSelectedClipId: string | null
  multiSelectedWordIds: Set<string>
  multiSelectedClipIds: Set<string>
  // Video playback synchronization
  playingWordId: string | null // Currently playing word from video timeline
  playingClipId: string | null // Currently playing clip from video timeline
}

// State priority levels (higher number = higher priority)
export enum WordStatePriority {
  NORMAL = 0,
  GROUPED = 1,
  FOCUSED = 2,
  EDITING = 3,
}

export interface WordSlice extends WordDragState {
  // State priority and guards
  getWordStatePriority: (wordId: string) => WordStatePriority | null
  canChangeWordState: (
    wordId: string,
    newPriority: WordStatePriority
  ) => boolean

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
    wordTiming?: { start: number; end: number },
    pluginKey?: string,
    timeOffset?: [number, number],
    params?: Record<string, unknown>
  ) => void
  addAnimationTrackAsync: (
    wordId: string,
    assetId: string,
    assetName: string,
    wordTiming?: { start: number; end: number },
    pluginKey?: string
  ) => Promise<void>
  setAnimationTrackPluginKey: (
    wordId: string,
    assetId: string,
    pluginKey: string
  ) => void
  updateAnimationTrackParams: (
    wordId: string,
    assetId: string,
    params: Record<string, unknown>
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

  // Batch apply/toggle for multi-selection
  toggleAnimationForWords: (
    wordIds: string[],
    asset: { id: string; name: string; pluginKey?: string }
  ) => void

  // Multi-selection methods
  selectWordRange: (toClipId: string, toWordId: string) => void
  toggleMultiSelectWord: (clipId: string, wordId: string) => void
  clearMultiSelection: () => void
  deleteSelectedWords: () => void
  isMultipleWordsSelected: () => boolean
  getSelectedWordsByClip: () => Map<string, string[]>
  setLastSelectedWord: (clipId: string, wordId: string) => void

  // Video playback synchronization
  setPlayingWord: (clipId: string | null, wordId: string | null) => void
  clearPlayingWord: () => void
  isWordPlaying: (wordId: string) => boolean

  // Template application
  applyTemplateToWords: (
    templateId: string,
    wordIds: string[],
    audioData?: unknown
  ) => Promise<void>
  applyTemplateToSelection: (
    templateId: string,
    audioData?: unknown
  ) => Promise<void>

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
  // Multi-selection initial state
  lastSelectedWordId: null,
  lastSelectedClipId: null,
  multiSelectedWordIds: new Set(),
  multiSelectedClipIds: new Set(),
  playingWordId: null,
  playingClipId: null,

  // Focus management
  setFocusedWord: (clipId, wordId) =>
    set((state) => {
      // Prevent unnecessary updates if already focused on the same word
      if (state.focusedClipId === clipId && state.focusedWordId === wordId) {
        return state
      }

      // Check if clip focus is changing - if so, close waveform modal
      const isClipFocusChanging =
        state.focusedClipId && state.focusedClipId !== clipId

      return {
        focusedClipId: clipId,
        focusedWordId: wordId,
        groupedWordIds: wordId ? new Set([wordId]) : new Set(),
        // Clear editing state when focusing on different word
        editingWordId:
          state.editingWordId === wordId ? state.editingWordId : null,
        editingClipId:
          state.editingClipId === clipId ? state.editingClipId : null,
        // Close waveform modal if clip focus is changing
        expandedClipId: isClipFocusChanging ? null : state.expandedClipId,
        expandedWordId: isClipFocusChanging ? null : state.expandedWordId,
      }
    }),

  clearWordFocus: () =>
    set((state) => {
      // Only clear if there's actually something to clear
      if (
        !state.focusedWordId &&
        !state.focusedClipId &&
        state.groupedWordIds.size === 0
      ) {
        return state
      }

      return {
        focusedWordId: null,
        focusedClipId: null,
        groupedWordIds: new Set(),
        // Close waveform modal when clearing focus
        expandedClipId: null,
        expandedWordId: null,
      }
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
    set((state) => {
      // Don't expand if multiple words are selected
      if (state.multiSelectedWordIds.size > 1) {
        return state
      }
      return {
        ...state,
        expandedClipId: clipId,
        expandedWordId: wordId,
        wordDetailOpen: false, // Close modal if open
      }
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

      // Reflect timing change into scenario (update baseTime and recompute pluginChain)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyGet = get() as any
        anyGet.updateWordBaseTime?.(wordId, start, end)
        anyGet.refreshWordPluginChain?.(wordId)
      } catch {
        // ignore if scenario slice not present
      }

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
  addAnimationTrack: (
    wordId,
    assetId,
    assetName,
    wordTiming,
    pluginKey,
    timeOffset,
    params
  ) =>
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
        pluginKey,
        timing: { ...timing },
        intensity: { min: 0.3, max: 0.7 },
        color,
        timeOffset,
        params,
      }

      newTracks.set(wordId, [...existingTracks, newTrack])

      // Update scenario pluginChain for this word
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyGet = get() as any
        anyGet.refreshWordPluginChain?.(wordId)
      } catch {
        // ignore
      }

      // Also sync with word.appliedAssets and word.animationTracks in clips
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyGet = get() as any
        if (
          (anyGet.applyAssetsToWord || anyGet.updateWordAnimationTracks) &&
          anyGet.clips
        ) {
          // Find the clip containing this word
          for (const clip of anyGet.clips) {
            const word = clip.words?.find((w: Word) => w.id === wordId)
            if (word) {
              // Get all current asset IDs for this word
              const allTracks = newTracks.get(wordId) || []
              const assetIds = allTracks.map((track) => track.assetId)
              if (anyGet.applyAssetsToWord) {
                anyGet.applyAssetsToWord(clip.id, wordId, assetIds)
              }
              if (anyGet.updateWordAnimationTracks) {
                anyGet.updateWordAnimationTracks(clip.id, wordId, allTracks)
              }
              break
            }
          }
        }
      } catch {
        // ignore
      }

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

      // Update scenario pluginChain for this word
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyGet = get() as any
        anyGet.refreshWordPluginChain?.(wordId)
      } catch {
        // ignore
      }

      // Also sync with word.appliedAssets and word.animationTracks in clips
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyGet = get() as any
        if (
          (anyGet.applyAssetsToWord || anyGet.updateWordAnimationTracks) &&
          anyGet.clips
        ) {
          // Find the clip containing this word
          for (const clip of anyGet.clips) {
            const word = clip.words?.find((w: Word) => w.id === wordId)
            if (word) {
              // Get remaining asset IDs for this word
              const remainingTracks = newTracks.get(wordId) || []
              const assetIds = remainingTracks.map((track) => track.assetId)
              if (anyGet.applyAssetsToWord) {
                anyGet.applyAssetsToWord(clip.id, wordId, assetIds)
              }
              if (anyGet.updateWordAnimationTracks) {
                anyGet.updateWordAnimationTracks(
                  clip.id,
                  wordId,
                  remainingTracks
                )
              }
              break
            }
          }
        }
      } catch {
        // ignore
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

      // Recompute pluginChain timeOffset for this word
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyGet = get() as any
        anyGet.refreshWordPluginChain?.(wordId)
      } catch {
        // ignore
      }

      // Mirror timing to word.animationTracks for UI sync
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyGet = get() as any
        if (anyGet.updateWordAnimationTracks && anyGet.clips) {
          for (const clip of anyGet.clips) {
            const hasWord = clip.words?.some((w: Word) => w.id === wordId)
            if (hasWord) {
              anyGet.updateWordAnimationTracks(clip.id, wordId, updatedTracks)
              break
            }
          }
        }
      } catch {}

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
      // Clear pluginChain for this word in scenario as well
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyGet = get() as any
        anyGet.refreshWordPluginChain?.(wordId)
      } catch {
        // ignore
      }
      // Also clear word.animationTracks in clips
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyGet = get() as any
        if (anyGet.updateWordAnimationTracks && anyGet.clips) {
          for (const clip of anyGet.clips) {
            const hasWord = clip.words?.some((w: Word) => w.id === wordId)
            if (hasWord) {
              anyGet.updateWordAnimationTracks(clip.id, wordId, [])
              break
            }
          }
        }
      } catch {}
      return { wordAnimationTracks: newTracks }
    }),

  // Batch apply/toggle for multi-selection
  toggleAnimationForWords: (wordIds, asset) =>
    set((state) => {
      const newTracks = new Map(state.wordAnimationTracks)
      const colors: ('blue' | 'green' | 'purple')[] = [
        'blue',
        'green',
        'purple',
      ]

      // Helper to find timing fallback from clips
      const findTiming = (wordId: string): { start: number; end: number } => {
        const adj = state.wordTimingAdjustments.get(wordId)
        if (adj) return adj
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const anyGet = get() as any
          const clips = anyGet.clips || []
          for (const clip of clips) {
            const w = clip.words?.find((x: Word) => x.id === wordId)
            if (w) return { start: w.start, end: w.end }
          }
        } catch {}
        return { start: 0, end: 1 }
      }

      // Apply toggles in memory first
      for (const wordId of wordIds) {
        const existing = newTracks.get(wordId) || []
        const already = existing.findIndex((t) => t.assetId === asset.id)
        if (already >= 0) {
          // Remove this asset, then recolor
          const filtered = existing.filter((t) => t.assetId !== asset.id)
          if (filtered.length === 0) {
            newTracks.delete(wordId)
          } else {
            const recolored = filtered.map((t, i) => ({
              ...t,
              color: colors[i],
            }))
            newTracks.set(wordId, recolored)
          }
        } else {
          if (existing.length >= 3) continue // respect max 3 per word
          const timing = findTiming(wordId)
          const color = colors[existing.length]
          const track: AnimationTrack = {
            assetId: asset.id,
            assetName: asset.name,
            pluginKey: asset.pluginKey,
            timing: { ...timing },
            intensity: { min: 0.3, max: 0.7 },
            color,
          }
          newTracks.set(wordId, [...existing, track])
        }
      }

      // Reflect into clips + scenario for each affected word
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyGet = get() as any
        const clips = anyGet.clips || []
        for (const wordId of wordIds) {
          const tracks = newTracks.get(wordId) || []
          // appliedAssets
          if (anyGet.applyAssetsToWord) {
            for (const clip of clips) {
              const has = clip.words?.some((w: Word) => w.id === wordId)
              if (has) {
                anyGet.applyAssetsToWord(
                  clip.id,
                  wordId,
                  tracks.map((t: AnimationTrack) => t.assetId)
                )
                break
              }
            }
          }
          // mirror animationTracks onto word
          if (anyGet.updateWordAnimationTracks) {
            for (const clip of clips) {
              const has = clip.words?.some((w: Word) => w.id === wordId)
              if (has) {
                anyGet.updateWordAnimationTracks(clip.id, wordId, tracks)
                break
              }
            }
          }
          // scenario refresh
          anyGet.refreshWordPluginChain?.(wordId)
        }
      } catch {}

      return { wordAnimationTracks: newTracks }
    }),

  // Atomic update params for a track with rollback support
  updateAnimationTrackParams: (
    wordId: string,
    assetId: string,
    partialParams: Record<string, unknown>
  ) =>
    set((state) => {
      // Create backup for rollback
      const backupTracks = new Map(state.wordAnimationTracks)

      try {
        const newTracks = new Map(state.wordAnimationTracks)
        const existing = newTracks.get(wordId) || []

        // Validate that the track exists
        const trackExists = existing.some((t) => t.assetId === assetId)
        if (!trackExists) {
          console.warn(`Animation track ${assetId} not found for word ${wordId}`)
          return state // No change if track doesn't exist
        }

        const updated = existing.map((t) =>
          t.assetId === assetId
            ? { ...t, params: { ...(t.params || {}), ...partialParams } }
            : t
        )
        newTracks.set(wordId, updated)

        // Atomic updates: all operations must succeed or rollback
        let scenarioUpdateFailed = false
        let clipUpdateFailed = false

        // Update scenario
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const anyGet = get() as any
          anyGet.refreshWordPluginChain?.(wordId)
        } catch (error) {
          console.error('Failed to update scenario for word params:', error)
          scenarioUpdateFailed = true
        }

        // Update clip data
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const anyGet = get() as any
          if (anyGet.updateWordAnimationTracks && anyGet.clips) {
            for (const clip of anyGet.clips) {
              const hasWord = clip.words?.some((w: Word) => w.id === wordId)
              if (hasWord) {
                anyGet.updateWordAnimationTracks(clip.id, wordId, updated)
                break
              }
            }
          }
        } catch (error) {
          console.error('Failed to update clip data for word params:', error)
          clipUpdateFailed = true
        }

        // If critical updates failed, rollback
        if (scenarioUpdateFailed) {
          console.warn('Rolling back parameter update due to scenario update failure')
          return { wordAnimationTracks: backupTracks }
        }

        // Clip update failure is less critical, just log it
        if (clipUpdateFailed) {
          console.warn('Clip data sync failed, but parameter update succeeded')
        }

        return { wordAnimationTracks: newTracks }
      } catch (error) {
        console.error('Failed to update animation track params:', error)
        return { wordAnimationTracks: backupTracks }
      }
    }),

  // Video playback synchronization
  setPlayingWord: (clipId, wordId) =>
    set((state) => {
      // Only update if the playing word has actually changed
      if (state.playingClipId === clipId && state.playingWordId === wordId) {
        return state
      }

      return {
        playingClipId: clipId,
        playingWordId: wordId,
      }
    }),

  clearPlayingWord: () =>
    set({
      playingWordId: null,
      playingClipId: null,
    }),

  isWordPlaying: (wordId) => {
    const state = get()
    return state.playingWordId === wordId
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

  isEditingWord: (wordId) => {
    const state = get()
    return state.editingWordId === wordId
  },

  getWordStatePriority: (wordId) => {
    const state = get()
    if (state.editingWordId === wordId) return WordStatePriority.EDITING
    if (state.focusedWordId === wordId) return WordStatePriority.FOCUSED
    if (state.groupedWordIds.has(wordId)) return WordStatePriority.GROUPED
    return WordStatePriority.NORMAL
  },

  canChangeWordState: (wordId, newPriority) => {
    const state = get()
    if (state.isDraggingWord || state.isGroupSelecting) return false

    const currentPriority = get().getWordStatePriority(wordId)
    if (currentPriority === null) return true

    // Higher priority states can override lower ones
    return newPriority >= currentPriority
  },

  // Async animation track management
  addAnimationTrackAsync: async (
    wordId,
    assetId,
    assetName,
    wordTiming,
    pluginKey
  ) => {
    // Fetch timeOffset and default params from plugin manifest
    const timeOffset = await getPluginTimeOffset(pluginKey)
    // Lazy import to avoid cycle; use same loader file
    const { getPluginDefaultParams } = await import(
      '../../utils/pluginManifestLoader'
    )
    const defaultParams = await getPluginDefaultParams(pluginKey)

    // Call the regular addAnimationTrack with the fetched timeOffset
    const state = get()
    state.addAnimationTrack(
      wordId,
      assetId,
      assetName,
      wordTiming,
      pluginKey,
      timeOffset,
      defaultParams
    )
  },

  setAnimationTrackPluginKey: (wordId, assetId, pluginKey) =>
    set((state) => {
      const newTracks = new Map(state.wordAnimationTracks)
      const existing = newTracks.get(wordId) || []
      let changed = false
      const updated = existing.map((t) => {
        if (t.assetId === assetId && t.pluginKey !== pluginKey) {
          changed = true
          return { ...t, pluginKey }
        }
        return t
      })
      if (!changed) return state
      newTracks.set(wordId, updated)

      // Mirror to clips and refresh scenario
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyGet = get() as any
        if (anyGet.updateWordAnimationTracks && anyGet.clips) {
          for (const clip of anyGet.clips) {
            const hasWord = clip.words?.some((w: Word) => w.id === wordId)
            if (hasWord) {
              anyGet.updateWordAnimationTracks(clip.id, wordId, updated)
              break
            }
          }
        }
        anyGet.refreshWordPluginChain?.(wordId)
      } catch {}

      return { wordAnimationTracks: newTracks }
    }),

  

  // Multi-selection implementations
  selectWordRange: (toClipId, toWordId) =>
    set((state) => {
      // Get clips from store (assuming clips are available in the global store)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyGet = get() as any
      const clips = anyGet.clips || []

      const selectedIds = new Set<string>()
      const selectedClipIds = new Set<string>()

      const fromClipId = state.lastSelectedClipId
      const fromWordId = state.lastSelectedWordId

      // Find clip indices
      const fromClipIndex = clips.findIndex(
        (c: ClipItem) => c.id === fromClipId
      )
      const toClipIndex = clips.findIndex((c: ClipItem) => c.id === toClipId)

      if (fromClipIndex === -1 || toClipIndex === -1) return state

      const startClipIndex = Math.min(fromClipIndex, toClipIndex)
      const endClipIndex = Math.max(fromClipIndex, toClipIndex)

      // Select words across clips
      for (let ci = startClipIndex; ci <= endClipIndex; ci++) {
        const clip = clips[ci]
        selectedClipIds.add(clip.id)

        if (ci === fromClipIndex && ci === toClipIndex) {
          // Same clip - select range within
          const fromIdx = clip.words.findIndex((w: Word) => w.id === fromWordId)
          const toIdx = clip.words.findIndex((w: Word) => w.id === toWordId)
          const start = Math.min(fromIdx, toIdx)
          const end = Math.max(fromIdx, toIdx)

          for (let wi = start; wi <= end; wi++) {
            selectedIds.add(clip.words[wi].id)
          }
        } else if (ci === fromClipIndex) {
          // Start clip - select from word to end
          const fromIdx = clip.words.findIndex((w: Word) => w.id === fromWordId)
          for (let wi = fromIdx; wi < clip.words.length; wi++) {
            selectedIds.add(clip.words[wi].id)
          }
        } else if (ci === toClipIndex) {
          // End clip - select from start to word
          const toIdx = clip.words.findIndex((w: Word) => w.id === toWordId)
          for (let wi = 0; wi <= toIdx; wi++) {
            selectedIds.add(clip.words[wi].id)
          }
        } else {
          // Middle clips - select all words
          clip.words.forEach((w: Word) => selectedIds.add(w.id))
        }
      }

      return {
        multiSelectedWordIds: selectedIds,
        multiSelectedClipIds: selectedClipIds,
        lastSelectedWordId: toWordId,
        lastSelectedClipId: toClipId,
        focusedWordId: toWordId,
        focusedClipId: toClipId,
        expandedClipId: null, // Close waveform
        expandedWordId: null,
      }
    }),

  toggleMultiSelectWord: (clipId, wordId) =>
    set((state) => {
      const newSelection = new Set(state.multiSelectedWordIds)
      const newClipSelection = new Set(state.multiSelectedClipIds)

      if (newSelection.has(wordId)) {
        newSelection.delete(wordId)

        // Check if clip still has selected words

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyGet = get() as any
        const clips = anyGet.clips || []
        const clip = clips.find((c: ClipItem) => c.id === clipId)
        if (clip) {
          const hasOtherSelectedWords = clip.words.some(
            (w: Word) => w.id !== wordId && newSelection.has(w.id)
          )
          if (!hasOtherSelectedWords) {
            newClipSelection.delete(clipId)
          }
        }
      } else {
        newSelection.add(wordId)
        newClipSelection.add(clipId)
      }

      return {
        multiSelectedWordIds: newSelection,
        multiSelectedClipIds: newClipSelection,
        lastSelectedWordId: wordId,
        lastSelectedClipId: clipId,
        focusedWordId: wordId,
        focusedClipId: clipId,
        expandedClipId: null, // Close waveform for multi-selection
        expandedWordId: null,
      }
    }),

  clearMultiSelection: () =>
    set({
      multiSelectedWordIds: new Set(),
      multiSelectedClipIds: new Set(),
      lastSelectedWordId: null,
      lastSelectedClipId: null,
    }),

  deleteSelectedWords: () =>
    set(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyGet = get() as any
      const clips = anyGet.clips || []
      const selectedByClip = get().getSelectedWordsByClip()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedClips = clips.map((clip: any) => {
        const selectedInClip = selectedByClip.get(clip.id)
        if (!selectedInClip || selectedInClip.length === 0) {
          return clip
        }

        // Filter out selected words
        const remainingWords = clip.words.filter(
          (w: Word) => !selectedInClip.includes(w.id)
        )

        // Rebuild fullText and subtitle
        const fullText = remainingWords.map((w: Word) => w.text).join(' ')

        return {
          ...clip,
          words: remainingWords,
          fullText,
          subtitle: fullText, // Update subtitle too
        }
      })

      // Update clips in global store
      try {
        anyGet.updateClips?.(updatedClips)
      } catch {
        // ignore if update method not available
      }

      // Clear selection after delete
      return {
        multiSelectedWordIds: new Set(),
        multiSelectedClipIds: new Set(),
        focusedWordId: null,
        focusedClipId: null,
        lastSelectedWordId: null,
        lastSelectedClipId: null,
        expandedClipId: null,
        expandedWordId: null,
      }
    }),

  setLastSelectedWord: (clipId, wordId) =>
    set({
      lastSelectedWordId: wordId,
      lastSelectedClipId: clipId,
    }),

  // Utility methods
  isMultipleWordsSelected: () => {
    const state = get()
    return state.multiSelectedWordIds.size > 1
  },

  getSelectedWordsByClip: () => {
    const state = get()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyGet = get() as any
    const clips = anyGet.clips || []
    const result = new Map<string, string[]>()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clips.forEach((clip: any) => {
      const selectedInClip = clip.words
        .filter((w: Word) => state.multiSelectedWordIds.has(w.id))
        .map((w: Word) => w.id)

      if (selectedInClip.length > 0) {
        result.set(clip.id, selectedInClip)
      }
    })

    return result
  },

  // Template application implementation
  applyTemplateToWords: async (templateId, wordIds, audioData) => {
    try {
      // Load the template system
      const { TemplateSystem } = await import('@/lib/templates')
      const templateSystem = new TemplateSystem({ debugMode: false })

      // Apply template to each word
      for (const wordId of wordIds) {
        // Load audio data if not provided
        let processedAudioData = audioData
        if (!processedAudioData) {
          // Get audio data from real.json
          try {
            const response = await fetch('/real.json')
            processedAudioData = await response.json()
          } catch (error) {
            console.error('Failed to load audio data:', error)
            continue
          }
        }

        // Apply template to generate animation tracks
        const result = await templateSystem.applyTemplate(
          templateId,
          processedAudioData,
          { targetWordId: wordId }
        )

        // Convert template results to animation tracks
        if (result.animationTracks) {
          const state = get()

          // Clear existing animation tracks for the word
          state.clearAnimationTracks(wordId)

          // Add new animation tracks from template
          for (const track of result.animationTracks) {
            await state.addAnimationTrackAsync(
              wordId,
              track.assetId,
              track.assetName,
              track.timing,
              track.pluginKey
            )

            // Apply template parameters
            if (track.params) {
              // Use the existing method for updating animation track parameters
              const animationTracks =
                state.wordAnimationTracks.get(wordId) || []
              const updatedTracks = animationTracks.map((t) =>
                t.assetId === track.assetId
                  ? { ...t, params: { ...t.params, ...track.params } }
                  : t
              )
              state.wordAnimationTracks.set(wordId, updatedTracks)
            }

            // Apply intensity settings
            if (track.intensity) {
              state.updateAnimationTrackIntensity(
                wordId,
                track.assetId,
                track.intensity.min,
                track.intensity.max
              )
            }
          }
        }
      }

      console.log(`Applied template ${templateId} to ${wordIds.length} words`)
    } catch (error) {
      console.error('Failed to apply template:', error)
      throw error
    }
  },

  applyTemplateToSelection: async (templateId, audioData) => {
    const state = get()
    const selectedWordIds = Array.from(state.multiSelectedWordIds)

    if (selectedWordIds.length === 0) {
      // If no multi-selection, apply to focused word
      if (state.focusedWordId) {
        await get().applyTemplateToWords(
          templateId,
          [state.focusedWordId],
          audioData
        )
      } else {
        console.warn('No words selected for template application')
      }
    } else {
      await get().applyTemplateToWords(templateId, selectedWordIds, audioData)
    }
  },
})
