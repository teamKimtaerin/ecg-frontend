import { StateCreator } from 'zustand'
import { EditorTab } from '../../types'

export interface UISlice {
  // Tab state
  activeTab: EditorTab
  setActiveTab: (tab: EditorTab) => void

  // DnD state
  activeId: string | null
  setActiveId: (id: string | null) => void

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

  // Video state
  isVideoPlaying: false,
  setIsVideoPlaying: (playing) => set({ isVideoPlaying: playing }),

  // Panel resize state
  videoPanelWidth: 300, // Default width (minimum width)
  setVideoPanelWidth: (width) => set({ videoPanelWidth: width }),
})
