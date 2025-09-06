import { StateCreator } from 'zustand'
import { ClipItem, INITIAL_CLIPS } from '../../types'
import { arrayMove } from '@/lib/utils/array'

export interface ClipSlice {
  clips: ClipItem[]
  setClips: (clips: ClipItem[]) => void
  updateClipWords: (clipId: string, wordId: string, newText: string) => void
  reorderClips: (
    activeId: string,
    overId: string,
    selectedIds: Set<string>
  ) => void
}

export const createClipSlice: StateCreator<ClipSlice> = (set) => ({
  clips: INITIAL_CLIPS,

  setClips: (clips) => set({ clips }),

  updateClipWords: (clipId, wordId, newText) => {
    set((state) => ({
      clips: state.clips.map((clip) =>
        clip.id === clipId
          ? {
              ...clip,
              words: clip.words.map((word) =>
                word.id === wordId ? { ...word, text: newText } : word
              ),
              fullText: clip.words
                .map((word) => (word.id === wordId ? newText : word.text))
                .join(' '),
            }
          : clip
      ),
    }))
  },

  reorderClips: (activeId, overId, selectedIds) => {
    set((state) => {
      const { clips } = state
      const oldIndex = clips.findIndex((item) => item.id === activeId)
      const newIndex = clips.findIndex((item) => item.id === overId)

      // If multiple items are selected, move them as a group
      if (selectedIds.size > 1 && selectedIds.has(activeId)) {
        const selectedItems = clips.filter((item) => selectedIds.has(item.id))
        const unselectedItems = clips.filter(
          (item) => !selectedIds.has(item.id)
        )

        // Remove selected items from their original positions
        const tempItems = [...unselectedItems]

        // Insert selected items at the new position
        const insertIndex =
          tempItems.findIndex((item) => item.id === overId) +
          (newIndex > oldIndex ? 1 : 0)

        tempItems.splice(insertIndex, 0, ...selectedItems)
        return { clips: tempItems }
      } else {
        // Single item drag
        return { clips: arrayMove(clips, oldIndex, newIndex) }
      }
    })
  },
})
