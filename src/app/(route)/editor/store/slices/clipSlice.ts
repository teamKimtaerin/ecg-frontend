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

export interface ClipSlice {
  clips: ClipItem[]
  currentProject: ProjectData | null
  setClips: (clips: ClipItem[]) => void
  updateClipWords: (clipId: string, wordId: string, newText: string) => void
  reorderClips: (
    activeId: string,
    overId: string,
    selectedIds: Set<string>
  ) => void
  // Project management
  saveProject: (name?: string) => Promise<void>
  loadProject: (id: string) => Promise<void>
  createNewProject: (name?: string) => void
  setCurrentProject: (project: ProjectData) => void
}

export const createClipSlice: StateCreator<
  ClipSlice & SaveSlice,
  [],
  [],
  ClipSlice
> = (set, get) => ({
  clips: [], // 초기 더미 데이터 제거
  currentProject: null,

  setClips: (clips) => set({ clips }),

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
