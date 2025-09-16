// Clip related types
export interface Word {
  id: string
  text: string
  start: number
  end: number
  isEditable: boolean
  confidence?: number
  appliedAssets?: string[]
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

// UI related types
export type EditorTab =
  | 'home'
  | 'edit'
  | 'subtitle'
  | 'format'
  | 'insert'
  | 'template'
  | 'effect'

export interface SelectionBox {
  startX: number
  startY: number
  endX: number
  endY: number
}

// Component Props types
export interface ClipStyleState {
  isSelected: boolean
  isChecked: boolean
  isMultiSelected: boolean
  isHovered: boolean
  isDragging?: boolean
}

export interface EditorHeaderTabsProps {
  activeTab: EditorTab
  onTabChange: (tabId: EditorTab) => void
}

export interface ToolbarProps {
  activeTab: EditorTab
}

export interface ClipTableProps {
  clips: ClipItem[]
  selectedClipIds: Set<string>
  onClipSelect: (clipId: string, multiSelect: boolean) => void
  onWordEdit: (clipId: string, wordId: string, newText: string) => void
  onClipsReorder: (newClips: ClipItem[]) => void
}

// Initial data
export const INITIAL_CLIPS: ClipItem[] = []

// 개발용 샘플 데이터 (필요시 사용)
export const SAMPLE_CLIPS: ClipItem[] = [
  {
    id: '1',
    timeline: '0:00:15',
    speaker: 'Speaker 1',
    subtitle: '이제 웹님',
    fullText: '이제 웹님',
    duration: '1.283초',
    thumbnail: '/placeholder-thumb.jpg',
    words: [
      { id: '1-1', text: '이제', start: 15.0, end: 15.5, isEditable: true },
      { id: '1-2', text: '웹님', start: 15.5, end: 16.0, isEditable: true },
    ],
  },
  {
    id: '2',
    timeline: '0:00:24',
    speaker: 'Speaker 2',
    subtitle: '네시요',
    fullText: '네시요',
    duration: '14.683초',
    thumbnail: '/placeholder-thumb.jpg',
    words: [
      { id: '2-1', text: '네시요', start: 24.0, end: 24.8, isEditable: true },
    ],
  },
  {
    id: '3',
    timeline: '0:00:32',
    speaker: 'Speaker 1',
    subtitle: '지금다',
    fullText: '지금다',
    duration: '4.243초',
    thumbnail: '/placeholder-thumb.jpg',
    words: [
      { id: '3-1', text: '지금다', start: 32.0, end: 32.8, isEditable: true },
    ],
  },
  {
    id: '4',
    timeline: '0:00:41',
    speaker: 'Speaker 1',
    subtitle: '이 지금 이는 한 공에',
    fullText: '이 지금 이는 한 공에',
    duration: '6.163초',
    thumbnail: '/placeholder-thumb.jpg',
    words: [
      { id: '4-1', text: '이', start: 41.0, end: 41.2, isEditable: true },
      { id: '4-2', text: '지금', start: 41.2, end: 41.6, isEditable: true },
      { id: '4-3', text: '이는', start: 41.6, end: 41.9, isEditable: true },
      { id: '4-4', text: '한', start: 41.9, end: 42.1, isEditable: true },
      { id: '4-5', text: '공에', start: 42.1, end: 42.5, isEditable: true },
    ],
  },
]

// Constants
export const DRAG_ACTIVATION_DISTANCE = 8

export const EDITOR_TABS: EditorTab[] = [
  'home',
  'edit',
  'subtitle',
  'format',
  'insert',
  'template',
  'effect',
]
