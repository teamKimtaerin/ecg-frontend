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

  // Right Sidebar state
  rightSidebarType: 'speaker' | 'animation' | 'template' | null
  setRightSidebarType: (
    type: 'speaker' | 'animation' | 'template' | null
  ) => void

  // Editing Mode state
  editingMode: 'simple' | 'advanced'
  setEditingMode: (mode: 'simple' | 'advanced') => void

  // Animation Asset Sidebar state
  isAssetSidebarOpen: boolean
  setIsAssetSidebarOpen: (open: boolean) => void
  assetSidebarWidth: number
  setAssetSidebarWidth: (width: number) => void
  assetSearchQuery: string
  setAssetSearchQuery: (query: string) => void
  activeAssetTab: 'free' | 'my'
  setActiveAssetTab: (tab: 'free' | 'my') => void
  // Word-specific asset selection
  selectedWordAssets: Record<string, string[]>
  setSelectedWordAssets: (wordAssets: Record<string, string[]>) => void
  currentWordAssets: string[]
  setCurrentWordAssets: (assets: string[]) => void
  updateWordAssets: (wordId: string, assets: string[]) => void

  // Asset expansion state
  expandedAssetId: string | null
  setExpandedAssetId: (assetId: string | null) => void

  // Word selection state
  selectedWordId: string | null
  setSelectedWordId: (wordId: string | null) => void
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

  // Right Sidebar state
  rightSidebarType: null,
  setRightSidebarType: (type) => set({ rightSidebarType: type }),

  // Editing Mode state
  editingMode: 'simple',
  setEditingMode: (mode) => set({ editingMode: mode }),

  // Animation Asset Sidebar state
  isAssetSidebarOpen: false,
  setIsAssetSidebarOpen: (open) => set({ isAssetSidebarOpen: open }),
  assetSidebarWidth: 320, // Default width
  setAssetSidebarWidth: (width) => set({ assetSidebarWidth: width }),
  assetSearchQuery: '',
  setAssetSearchQuery: (query) => set({ assetSearchQuery: query }),
  activeAssetTab: 'free',
  setActiveAssetTab: (tab) => set({ activeAssetTab: tab }),

  // Word-specific asset selection
  selectedWordAssets: {},
  setSelectedWordAssets: (wordAssets) =>
    set({ selectedWordAssets: wordAssets }),
  currentWordAssets: [],
  setCurrentWordAssets: (assets) => set({ currentWordAssets: assets }),
  updateWordAssets: (wordId, assets) =>
    set((state) => ({
      selectedWordAssets: {
        ...state.selectedWordAssets,
        [wordId]: assets,
      },
      currentWordAssets:
        state.selectedWordId === wordId ? assets : state.currentWordAssets,
    })),

  // Asset expansion state
  expandedAssetId: null,
  setExpandedAssetId: (assetId) => set({ expandedAssetId: assetId }),

  // Word selection state
  selectedWordId: null,
  setSelectedWordId: (wordId) => set({ selectedWordId: wordId }),
})
