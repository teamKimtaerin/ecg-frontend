import type { StateCreator } from 'zustand'
import {
  type TextInsertionSlice,
  type InsertedText,
  type TextPosition,
  type TextStyle,
  DEFAULT_TEXT_STYLE,
  createInsertedText,
  isTextActiveAtTime,
} from '../../types/textInsertion'

export type { TextInsertionSlice }

export const createTextInsertionSlice: StateCreator<
  TextInsertionSlice,
  [],
  [],
  TextInsertionSlice
> = (set, get) => ({
  // Initial state
  insertedTexts: [],
  selectedTextId: null,
  isInsertionMode: false,
  isEditingText: false,
  editingTextId: null,
  defaultStyle: DEFAULT_TEXT_STYLE,
  clipboard: [],

  // Mode management
  setInsertionMode: (enabled: boolean) => {
    set((state) => ({
      ...state,
      isInsertionMode: enabled,
      selectedTextId: enabled ? state.selectedTextId : null,
    }))
  },

  // Text CRUD operations
  addText: (textData) => {
    const newText: InsertedText = {
      ...textData,
      id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    set((state) => ({
      ...state,
      insertedTexts: [...state.insertedTexts, newText],
      selectedTextId: newText.id,
    }))
  },

  updateText: (id: string, updates: Partial<InsertedText>) => {
    set((state) => ({
      ...state,
      insertedTexts: state.insertedTexts.map((text) =>
        text.id === id
          ? { ...text, ...updates, updatedAt: Date.now() }
          : text
      ),
    }))
  },

  deleteText: (id: string) => {
    set((state) => ({
      ...state,
      insertedTexts: state.insertedTexts.filter((text) => text.id !== id),
      selectedTextId: state.selectedTextId === id ? null : state.selectedTextId,
      editingTextId: state.editingTextId === id ? null : state.editingTextId,
    }))
  },

  duplicateText: (id: string) => {
    const { insertedTexts } = get()
    const originalText = insertedTexts.find((text) => text.id === id)
    
    if (originalText) {
      const duplicatedText: InsertedText = {
        ...originalText,
        id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        position: {
          x: Math.min(95, originalText.position.x + 5),
          y: Math.min(95, originalText.position.y + 5),
        },
        startTime: originalText.startTime + 1,
        endTime: originalText.endTime + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isSelected: false,
        isEditing: false,
      }

      set((state) => ({
        ...state,
        insertedTexts: [...state.insertedTexts, duplicatedText],
        selectedTextId: duplicatedText.id,
      }))
    }
  },

  // Selection management
  selectText: (id: string | null) => {
    set((state) => ({
      ...state,
      selectedTextId: id,
      insertedTexts: state.insertedTexts.map((text) => ({
        ...text,
        isSelected: text.id === id,
      })),
    }))
  },

  clearSelection: () => {
    set((state) => ({
      ...state,
      selectedTextId: null,
      insertedTexts: state.insertedTexts.map((text) => ({
        ...text,
        isSelected: false,
      })),
    }))
  },

  // Editing management
  startEditing: (id: string) => {
    set((state) => ({
      ...state,
      isEditingText: true,
      editingTextId: id,
      selectedTextId: id,
      insertedTexts: state.insertedTexts.map((text) => ({
        ...text,
        isEditing: text.id === id,
        isSelected: text.id === id,
      })),
    }))
  },

  stopEditing: () => {
    set((state) => ({
      ...state,
      isEditingText: false,
      editingTextId: null,
      insertedTexts: state.insertedTexts.map((text) => ({
        ...text,
        isEditing: false,
      })),
    }))
  },

  // Style management
  updateDefaultStyle: (style: Partial<TextStyle>) => {
    set((state) => ({
      ...state,
      defaultStyle: { ...state.defaultStyle, ...style },
    }))
  },

  applyStyleToSelected: (style: Partial<TextStyle>) => {
    const { selectedTextId } = get()
    if (!selectedTextId) return

    set((state) => ({
      ...state,
      insertedTexts: state.insertedTexts.map((text) =>
        text.id === selectedTextId
          ? {
              ...text,
              style: { ...text.style, ...style },
              updatedAt: Date.now(),
            }
          : text
      ),
    }))
  },

  // Clipboard operations
  copyText: (id: string) => {
    const { insertedTexts } = get()
    const textToCopy = insertedTexts.find((text) => text.id === id)
    
    if (textToCopy) {
      set((state) => ({
        ...state,
        clipboard: [textToCopy],
      }))
    }
  },

  cutText: (id: string) => {
    const { copyText, deleteText } = get()
    copyText(id)
    deleteText(id)
  },

  pasteText: (position: TextPosition, currentTime: number) => {
    const { clipboard, addText } = get()
    
    if (clipboard.length > 0) {
      const textToPaste = clipboard[0]
      const pastedText = createInsertedText(
        textToPaste.content,
        position,
        currentTime,
        currentTime + (textToPaste.endTime - textToPaste.startTime),
        textToPaste.style,
        textToPaste.animation
      )
      
      addText(pastedText)
    }
  },

  // Batch operations
  deleteSelectedTexts: () => {
    const { selectedTextId, deleteText } = get()
    if (selectedTextId) {
      deleteText(selectedTextId)
    }
  },

  moveTexts: (ids: string[], deltaPosition: TextPosition) => {
    set((state) => ({
      ...state,
      insertedTexts: state.insertedTexts.map((text) =>
        ids.includes(text.id)
          ? {
              ...text,
              position: {
                x: Math.max(0, Math.min(100, text.position.x + deltaPosition.x)),
                y: Math.max(0, Math.min(100, text.position.y + deltaPosition.y)),
              },
              updatedAt: Date.now(),
            }
          : text
      ),
    }))
  },

  // Time management
  getActiveTexts: (currentTime: number) => {
    const { insertedTexts } = get()
    return insertedTexts.filter((text) => isTextActiveAtTime(text, currentTime))
  },

  updateTextTiming: (id: string, startTime: number, endTime: number) => {
    set((state) => ({
      ...state,
      insertedTexts: state.insertedTexts.map((text) =>
        text.id === id
          ? {
              ...text,
              startTime: Math.max(0, startTime),
              endTime: Math.max(startTime + 0.1, endTime),
              updatedAt: Date.now(),
            }
          : text
      ),
    }))
  },
})