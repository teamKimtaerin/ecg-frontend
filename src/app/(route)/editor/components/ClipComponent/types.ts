export interface Word {
  id: string
  text: string
  start: number
  end: number
  isEditable: boolean
  confidence?: number
}

export interface ClipItem {
  id: string
  timeline: string
  speaker: string
  subtitle: string
  fullText: string
  duration: string
  thumbnail: string
  words: Word[]
}

export interface ClipComponentProps {
  clip: ClipItem
  isSelected: boolean
  isChecked?: boolean
  isMultiSelected?: boolean
  enableDragAndDrop?: boolean
  onSelect: (clipId: string) => void
  onCheck?: (clipId: string, checked: boolean) => void
  onWordEdit: (clipId: string, wordId: string, newText: string) => void
  onSpeakerChange?: (clipId: string, newSpeaker: string) => void
}

export interface ClipStyleState {
  isSelected: boolean
  isChecked: boolean
  isMultiSelected: boolean
  isHovered: boolean
  isDragging?: boolean
}
