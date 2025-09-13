/**
 * Text insertion feature types
 */

export interface TextPosition {
  x: number // Percentage (0-100)
  y: number // Percentage (0-100)
}

export interface TextStyle {
  fontSize: number // In pixels
  fontFamily: string
  color: string
  backgroundColor?: string
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  textAlign: 'left' | 'center' | 'right'
  textShadow?: string
  borderRadius?: number
  padding?: number
  opacity?: number
}

export interface TextAnimation {
  type: 'none' | 'fadeIn' | 'slideUp' | 'typewriter' | 'bounce'
  duration: number // In seconds
  delay?: number // In seconds
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'
}

export interface InsertedText {
  id: string
  content: string
  startTime: number // In seconds
  endTime: number // In seconds
  position: TextPosition
  style: TextStyle
  animation?: TextAnimation
  isSelected?: boolean
  isEditing?: boolean
  createdAt: number
  updatedAt: number
}

export interface TextInsertionState {
  insertedTexts: InsertedText[]
  selectedTextId: string | null
  isInsertionMode: boolean
  isEditingText: boolean
  editingTextId: string | null
  isEditingPanelOpen: boolean
  defaultStyle: TextStyle
  clipboard: InsertedText[]
}

export interface TextInsertionActions {
  // Mode management
  setInsertionMode: (enabled: boolean) => void
  setEditingPanelOpen: (open: boolean) => void
  toggleEditingPanel: () => void
  
  // Text CRUD operations
  addText: (text: Omit<InsertedText, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateText: (id: string, updates: Partial<InsertedText>) => void
  deleteText: (id: string) => void
  duplicateText: (id: string) => void
  
  // Selection management
  selectText: (id: string | null) => void
  clearSelection: () => void
  
  // Editing management
  startEditing: (id: string) => void
  stopEditing: () => void
  
  // Style management
  updateDefaultStyle: (style: Partial<TextStyle>) => void
  applyStyleToSelected: (style: Partial<TextStyle>) => void
  
  // Clipboard operations
  copyText: (id: string) => void
  cutText: (id: string) => void
  pasteText: (position: TextPosition, currentTime: number) => void
  
  // Batch operations
  deleteSelectedTexts: () => void
  moveTexts: (ids: string[], deltaPosition: TextPosition) => void
  
  // Time management
  getActiveTexts: (currentTime: number) => InsertedText[]
  updateTextTiming: (id: string, startTime: number, endTime: number) => void
}

export type TextInsertionSlice = TextInsertionState & TextInsertionActions

// Default values
export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontSize: 24,
  fontFamily: 'Arial, sans-serif',
  color: '#ffffff',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  fontWeight: 'bold',
  fontStyle: 'normal',
  textAlign: 'center',
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
  borderRadius: 4,
  padding: 8,
  opacity: 1,
}

export const DEFAULT_TEXT_ANIMATION: TextAnimation = {
  type: 'fadeIn',
  duration: 0.5,
  delay: 0,
  easing: 'ease-out',
}

// Helper functions
export const createInsertedText = (
  content: string,
  position: TextPosition,
  startTime: number,
  endTime: number,
  style: Partial<TextStyle> = {},
  animation?: TextAnimation
): Omit<InsertedText, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    content,
    position,
    startTime,
    endTime,
    style: { ...DEFAULT_TEXT_STYLE, ...style },
    animation: animation || DEFAULT_TEXT_ANIMATION,
    isSelected: false,
    isEditing: false,
  }
}

export const isTextActiveAtTime = (text: InsertedText, currentTime: number): boolean => {
  return currentTime >= text.startTime && currentTime <= text.endTime
}

export const getTextDuration = (text: InsertedText): number => {
  return text.endTime - text.startTime
}

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}