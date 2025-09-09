import { StateCreator } from 'zustand'
import { EditorTab } from '../../types'
import { UI_PANEL_DEFAULTS } from '@/lib/utils/constants'

export interface UISlice {
  // Tab state
  activeTab: EditorTab
  setActiveTab: (tab: EditorTab) => void

  // DnD state
  activeId: string | null
  setActiveId: (id: string | null) => void
  overId: string | null
  setOverId: (id: string | null) => void

  // Other UI states can be added here
  isVideoPlaying: boolean
  setIsVideoPlaying: (playing: boolean) => void

  // Panel resize state
  videoPanelWidth: number
  setVideoPanelWidth: (width: number) => void
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  // Tab state
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // DnD state
  activeId: null,
  setActiveId: (id) => set({ activeId: id }),
  overId: null,
  setOverId: (id) => set({ overId: id }),

  // Video state
  isVideoPlaying: false,
  setIsVideoPlaying: (playing) => set({ isVideoPlaying: playing }),

  // Panel resize state
  videoPanelWidth: UI_PANEL_DEFAULTS.VIDEO_PANEL_MIN_WIDTH, // Default width (minimum width)
  setVideoPanelWidth: (width) => set({ videoPanelWidth: width }),
})
