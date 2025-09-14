import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { ClipSlice, createClipSlice } from './slices/clipSlice'
import { SelectionSlice, createSelectionSlice } from './slices/selectionSlice'
import { UISlice, createUISlice } from './slices/uiSlice'
import { SaveSlice, createSaveSlice } from './slices/saveSlice'
import { MediaSlice, createMediaSlice } from './slices/mediaSlice'
import { WordSlice, createWordSlice } from './slices/wordSlice'
import {
  TextInsertionSlice,
  createTextInsertionSlice,
} from './slices/textInsertionSlice'
import { TimelineSlice, createTimelineSlice } from './slices/timelineSlice'

// Combine all slices into a single store type
export type EditorStore = ClipSlice &
  SelectionSlice &
  UISlice &
  SaveSlice &
  MediaSlice &
  WordSlice &
  TextInsertionSlice &
  TimelineSlice

// Create the store with all slices
export const useEditorStore = create<EditorStore>()(
  devtools(
    (...a) => ({
      ...createClipSlice(...a),
      ...createSelectionSlice(...a),
      ...createUISlice(...a),
      ...createSaveSlice(...a),
      ...createMediaSlice(...a),
      ...createWordSlice(...a),
      ...createTextInsertionSlice(...a),
      ...createTimelineSlice(...a),
    }),
    {
      name: 'editor-store',
    }
  )
)
