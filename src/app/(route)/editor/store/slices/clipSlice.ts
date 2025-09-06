import { arrayMove } from '@/lib/utils/array'
import { StateCreator } from 'zustand'
import { ClipItem, INITIAL_CLIPS } from '../../types'

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
        // Get selected items in their current order
        const selectedItems = clips.filter((item) => selectedIds.has(item.id))
        const unselectedItems = clips.filter(
          (item) => !selectedIds.has(item.id)
        )

        // Find where to insert the group
        let insertIndex = 0

        // If dropping on an unselected item, insert before or after it
        if (!selectedIds.has(overId)) {
          const overIndexInUnselected = unselectedItems.findIndex(
            (item) => item.id === overId
          )

          // Determine if we should insert before or after the target
          // If dragging down (oldIndex < newIndex), insert after
          // If dragging up (oldIndex > newIndex), insert before
          if (oldIndex < newIndex) {
            insertIndex = overIndexInUnselected + 1
          } else {
            insertIndex = overIndexInUnselected
          }
        }

        // Create new array with items in correct positions
        const newClips = [
          ...unselectedItems.slice(0, insertIndex),
          ...selectedItems,
          ...unselectedItems.slice(insertIndex),
        ]

        return { clips: newClips }
      } else {
        // Single item drag
        return { clips: arrayMove(clips, oldIndex, newIndex) }
      }
    })
  },
})
