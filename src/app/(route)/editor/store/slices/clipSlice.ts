import { arrayMove } from '@/lib/utils/array'
import {
  projectStorage,
  defaultProjectSettings,
  generateProjectId,
} from '@/utils/storage/projectStorage'
import { AutosaveManager } from '@/utils/managers/AutosaveManager'
import { StateCreator } from 'zustand'
import { ClipItem } from '../../types'
import { ProjectData } from '../../types/project'
import { SaveSlice } from './saveSlice'
import { UISlice } from './uiSlice'

export interface ClipSlice {
  clips: ClipItem[]
  originalClips: ClipItem[] // 원본 클립 데이터 저장 (메모리)
  deletedClipIds: Set<string>
  currentProject: ProjectData | null
  setClips: (clips: ClipItem[]) => void
  setOriginalClips: (clips: ClipItem[]) => void // 원본 클립 설정
  restoreOriginalClips: () => void // 원본으로 복원
  saveOriginalClipsToStorage: () => Promise<void> // IndexedDB에 원본 클립 영구 저장
  loadOriginalClipsFromStorage: () => Promise<void> // IndexedDB에서 원본 클립 로드
  updateClipWords: (clipId: string, wordId: string, newText: string) => void

  applyAssetsToWord: (
    clipId: string,
    wordId: string,
    assetIds: string[]
  ) => void
  reorderWordsInClip: (
    clipId: string,
    sourceWordId: string,
    targetWordId: string
  ) => void
  reorderClips: (
    activeId: string,
    overId: string,
    selectedIds: Set<string>
  ) => void
  // Clip deletion management
  markClipAsDeleted: (clipId: string) => void
  restoreDeletedClip: (clipId: string) => void
  clearDeletedClips: () => void
  getActiveClips: () => ClipItem[]
  // Project management
  saveProject: (name?: string) => Promise<void>
  loadProject: (id: string) => Promise<void>
  createNewProject: (name?: string) => void
  setCurrentProject: (project: ProjectData) => void
}

export const createClipSlice: StateCreator<
  ClipSlice & SaveSlice & UISlice,
  [],
  [],
  ClipSlice
> = (set, get) => ({
  clips: [], // 초기 더미 데이터 제거
  originalClips: [], // 원본 클립 데이터
  deletedClipIds: new Set<string>(),
  currentProject: null,

  setClips: (clips) => set({ clips }),

  setOriginalClips: (clips) => set({ originalClips: clips }),

  restoreOriginalClips: () => {
    const { originalClips } = get()
    if (originalClips.length > 0) {
      set({ clips: [...originalClips] })
    }
  },

  saveOriginalClipsToStorage: async () => {
    const { currentProject, originalClips } = get()
    if (currentProject?.id && originalClips.length > 0) {
      try {
        const { projectStorage } = await import(
          '@/utils/storage/projectStorage'
        )
        await projectStorage.saveOriginalClips(currentProject.id, originalClips)
        console.log('Original clips saved to IndexedDB')
      } catch (error) {
        console.error('Failed to save original clips to storage:', error)
      }
    }
  },

  loadOriginalClipsFromStorage: async () => {
    const { currentProject } = get()
    if (currentProject?.id) {
      try {
        const { projectStorage } = await import(
          '@/utils/storage/projectStorage'
        )
        const storedOriginalClips = await projectStorage.loadOriginalClips(
          currentProject.id
        )
        if (storedOriginalClips && storedOriginalClips.length > 0) {
          set({ originalClips: storedOriginalClips as ClipItem[] })
          console.log('Original clips loaded from IndexedDB')
        }
      } catch (error) {
        console.error('Failed to load original clips from storage:', error)
      }
    }
  },

  // Clip deletion management
  markClipAsDeleted: (clipId) => {
    set((state) => {
      const newDeletedIds = new Set(state.deletedClipIds)
      newDeletedIds.add(clipId)
      return { deletedClipIds: newDeletedIds }
    })
  },

  restoreDeletedClip: (clipId) => {
    set((state) => {
      const newDeletedIds = new Set(state.deletedClipIds)
      newDeletedIds.delete(clipId)
      return { deletedClipIds: newDeletedIds }
    })
  },

  clearDeletedClips: () => {
    set({ deletedClipIds: new Set<string>() })
  },

  getActiveClips: () => {
    const state = get()
    return state.clips.filter((clip) => !state.deletedClipIds.has(clip.id))
  },

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

  applyAssetsToWord: (clipId, wordId, assetIds) => {
    set((state) => {
      const updatedState = {
        clips: state.clips.map((clip) =>
          clip.id === clipId
            ? {
                ...clip,
                words: clip.words.map((word) =>
                  word.id === wordId
                    ? { ...word, appliedAssets: assetIds }
                    : word
                ),
              }
            : clip
        ),
      }

      // Update UI state for word assets tracking
      const currentState = get() as ClipSlice & SaveSlice & UISlice
      if (currentState.updateWordAssets) {
        currentState.updateWordAssets(wordId, assetIds)
      }

      return updatedState
    })
  },

  reorderWordsInClip: (clipId, sourceWordId, targetWordId) => {
    set((state) => ({
      clips: state.clips.map((clip) => {
        if (clip.id !== clipId) return clip

        const words = [...clip.words]
        const sourceIndex = words.findIndex((w) => w.id === sourceWordId)
        const targetIndex = words.findIndex((w) => w.id === targetWordId)

        if (sourceIndex === -1 || targetIndex === -1) return clip

        // Remove source word
        const [movedWord] = words.splice(sourceIndex, 1)

        // Insert at target position
        const insertIndex =
          sourceIndex < targetIndex ? targetIndex : targetIndex
        words.splice(insertIndex, 0, movedWord)

        // Rebuild fullText and subtitle from reordered words
        const fullText = words.map((w) => w.text).join(' ')
        const subtitle = fullText // Or apply any subtitle-specific formatting

        return {
          ...clip,
          words,
          fullText,
          subtitle,
        }
      }),
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

  // Project management methods
  saveProject: async (name?: string) => {
    const state = get() as ClipSlice & {
      mediaId?: string | null
      videoUrl?: string | null
      videoName?: string | null
      videoType?: string | null
      videoDuration?: number | null
      videoMetadata?: Record<string, unknown>
    }
    let project = state.currentProject

    if (!project) {
      // Create new project if none exists
      project = {
        id: generateProjectId(),
        name: name || '새 프로젝트',
        clips: state.clips,
        settings: defaultProjectSettings,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Include media information
        mediaId: state.mediaId || undefined,
        videoUrl: state.videoUrl || undefined,
        videoName: state.videoName || undefined,
        videoType: state.videoType || undefined,
        videoDuration: state.videoDuration || undefined,
        videoMetadata: state.videoMetadata || undefined,
      }
    } else {
      // Update existing project
      project = {
        ...project,
        name: name || project.name,
        clips: state.clips,
        updatedAt: new Date(),
        // Update media information
        mediaId: state.mediaId || project.mediaId,
        videoUrl: state.videoUrl || project.videoUrl,
        videoName: state.videoName || project.videoName,
        videoType: state.videoType || project.videoType,
        videoDuration: state.videoDuration || project.videoDuration,
        videoMetadata: state.videoMetadata || project.videoMetadata,
      }
    }

    // 로컬에 저장
    await projectStorage.saveProject(project)

    // 현재 프로젝트 상태 저장 (세션 복구용)
    projectStorage.saveCurrentProject(project)

    set({ currentProject: project })

    // AutosaveManager 동기화
    const autosaveManager = AutosaveManager.getInstance()
    autosaveManager.setProject(project.id, 'browser')

    // Mark as saved in save state
    const currentState = get() as ClipSlice & SaveSlice
    if (currentState.markAsSaved) {
      currentState.markAsSaved()
    }
  },

  loadProject: async (id: string) => {
    const project = await projectStorage.loadProject(id)
    if (project) {
      set({
        clips: project.clips,
        currentProject: project,
      })
    }
  },

  createNewProject: (name?: string) => {
    const project: ProjectData = {
      id: generateProjectId(),
      name: name || '새 프로젝트',
      clips: [],
      settings: defaultProjectSettings,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    set({
      clips: [],
      currentProject: project,
    })
  },

  setCurrentProject: (project: ProjectData) => {
    set({ currentProject: project })
  },
})
