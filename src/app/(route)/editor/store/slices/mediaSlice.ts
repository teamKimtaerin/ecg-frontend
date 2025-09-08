/**
 * 미디어 상태 관리 슬라이스
 */

import { StateCreator } from 'zustand'
import { log } from '@/utils/logger'

export interface MediaState {
  // Media information
  mediaId: string | null
  videoUrl: string | null
  videoName: string | null
  videoType: string | null
  videoDuration: number | null
  videoMetadata: {
    width?: number
    height?: number
    frameRate?: number
    videoCodec?: string
    audioCodec?: string
  } | null
  isVideoLoading: boolean
  videoError: string | null
}

export interface MediaActions {
  setMediaInfo: (info: Partial<MediaState>) => void
  clearMedia: () => void
  setVideoLoading: (loading: boolean) => void
  setVideoError: (error: string | null) => void
}

export type MediaSlice = MediaState & MediaActions

const initialState: MediaState = {
  mediaId: null,
  videoUrl: null,
  videoName: null,
  videoType: null,
  videoDuration: null,
  videoMetadata: null,
  isVideoLoading: false,
  videoError: null,
}

export const createMediaSlice: StateCreator<MediaSlice> = (set) => ({
  ...initialState,

  setMediaInfo: (info) => {
    set((state) => {
      log('mediaSlice.ts', 'Media info updated', info)
      return {
        ...state,
        ...info,
      }
    })
  },

  clearMedia: () => {
    set(() => {
      log('mediaSlice.ts', 'Media cleared')
      return initialState
    })
  },

  setVideoLoading: (loading) => {
    set({ isVideoLoading: loading })
  },

  setVideoError: (error) => {
    if (error) {
      log('mediaSlice.ts', `Video error: ${error}`)
    }
    set({ videoError: error })
  },
})
