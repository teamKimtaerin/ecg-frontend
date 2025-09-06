import { StateCreator } from 'zustand'
import { SelectionBox } from '../../types'

export interface SelectionSlice {
  // Selection state
  selectedClipIds: Set<string>
  setSelectedClipIds: (ids: Set<string>) => void
  toggleClipSelection: (clipId: string, multiSelect: boolean) => void
  clearSelection: () => void
  addToSelection: (clipIds: string[]) => void

  // Selection box state
  isSelecting: boolean
  setIsSelecting: (selecting: boolean) => void
  selectionBox: SelectionBox
  setSelectionBox: (box: SelectionBox) => void
}

export const createSelectionSlice: StateCreator<SelectionSlice> = (set) => ({
  // Selection state
  selectedClipIds: new Set<string>(),

  setSelectedClipIds: (ids) => set({ selectedClipIds: ids }),

  toggleClipSelection: (clipId, multiSelect) => {
    set((state) => {
      const newSet = new Set(state.selectedClipIds)

      if (multiSelect) {
        // Toggle selection for multi-select
        if (newSet.has(clipId)) {
          newSet.delete(clipId)
        } else {
          newSet.add(clipId)
        }
      } else {
        // Single select - clear others
        newSet.clear()
        newSet.add(clipId)
      }

      return { selectedClipIds: newSet }
    })
  },

  clearSelection: () => set({ selectedClipIds: new Set<string>() }),

  addToSelection: (clipIds) => {
    set((state) => {
      const newSet = new Set(state.selectedClipIds)
      clipIds.forEach((id) => newSet.add(id))
      return { selectedClipIds: newSet }
    })
  },

  // Selection box state
  isSelecting: false,
  setIsSelecting: (selecting) => set({ isSelecting: selecting }),

  selectionBox: {
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  },

  setSelectionBox: (box) => set({ selectionBox: box }),
})
