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
  videoThumbnail: string | null // 비디오 썸네일 URL
  videoMetadata: {
    width?: number
    height?: number
    frameRate?: number
    videoCodec?: string
    audioCodec?: string
  } | null
  isVideoLoading: boolean
  videoError: string | null

  // Playback state
  currentTime: number
  isPlaying: boolean
  segmentStart: number | null
  segmentEnd: number | null
  isSegmentPlayback: boolean

  // Subtitle state
  showSubtitles: boolean
  subtitleSize: 'small' | 'medium' | 'large'
  subtitlePosition: 'top' | 'bottom'
}

export interface MediaActions {
  setMediaInfo: (info: Partial<MediaState>) => void
  clearMedia: () => void
  setVideoLoading: (loading: boolean) => void
  setVideoError: (error: string | null) => void

  // Playback actions
  setCurrentTime: (time: number) => void
  setIsPlaying: (playing: boolean) => void
  playSegment: (start: number, end: number) => void
  stopSegmentPlayback: () => void

  // Subtitle actions
  toggleSubtitles: () => void
  setSubtitleSize: (size: 'small' | 'medium' | 'large') => void
  setSubtitlePosition: (position: 'top' | 'bottom') => void
}

export type MediaSlice = MediaState & MediaActions

const initialState: MediaState = {
  mediaId: null,
  videoUrl: null,
  videoName: null,
  videoType: null,
  videoDuration: null,
  videoThumbnail: null,
  videoMetadata: null,
  isVideoLoading: false,
  videoError: null,

  // Playback state
  currentTime: 0,
  isPlaying: false,
  segmentStart: null,
  segmentEnd: null,
  isSegmentPlayback: false,

  // Subtitle state
  showSubtitles: true,
  subtitleSize: 'medium',
  subtitlePosition: 'bottom',
}

export const createMediaSlice: StateCreator<MediaSlice> = (set) => ({
  ...initialState,

  setMediaInfo: (info) => {
    set((state) => {
      // 새 썸네일이 있고 기존 썸네일과 다르면 기존 썸네일 정리
      if (
        info.videoThumbnail &&
        state.videoThumbnail &&
        state.videoThumbnail !== info.videoThumbnail &&
        state.videoThumbnail.startsWith('blob:')
      ) {
        try {
          URL.revokeObjectURL(state.videoThumbnail)
          log(
            'mediaSlice.ts',
            'Revoked old thumbnail blob URL:',
            state.videoThumbnail
          )
        } catch (error) {
          log(
            'mediaSlice.ts',
            'Failed to revoke old thumbnail blob URL:',
            error
          )
        }
      }

      // 새 비디오 URL이 있고 기존 비디오 URL과 다르면 기존 URL 정리
      if (
        info.videoUrl &&
        state.videoUrl &&
        state.videoUrl !== info.videoUrl &&
        state.videoUrl.startsWith('blob:')
      ) {
        try {
          URL.revokeObjectURL(state.videoUrl)
          log('mediaSlice.ts', 'Revoked old video blob URL:', state.videoUrl)
        } catch (error) {
          log('mediaSlice.ts', 'Failed to revoke old video blob URL:', error)
        }
      }

      log('mediaSlice.ts', 'Media info updated', info)
      return {
        ...state,
        ...info,
      }
    })
  },

  clearMedia: () => {
    set((state) => {
      // 기존 썸네일이 blob URL이면 메모리 정리
      if (state.videoThumbnail && state.videoThumbnail.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(state.videoThumbnail)
          log(
            'mediaSlice.ts',
            'Revoked thumbnail blob URL:',
            state.videoThumbnail
          )
        } catch (error) {
          log('mediaSlice.ts', 'Failed to revoke thumbnail blob URL:', error)
        }
      }

      // 기존 비디오 URL이 blob URL이면 메모리 정리
      if (state.videoUrl && state.videoUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(state.videoUrl)
          log('mediaSlice.ts', 'Revoked video blob URL:', state.videoUrl)
        } catch (error) {
          log('mediaSlice.ts', 'Failed to revoke video blob URL:', error)
        }
      }

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

  // Playback actions
  setCurrentTime: (time) => {
    set({ currentTime: time })
  },

  setIsPlaying: (playing) => {
    set({ isPlaying: playing })
  },

  playSegment: (start, end) => {
    set({
      segmentStart: start,
      segmentEnd: end,
      isSegmentPlayback: true,
      isPlaying: true,
      currentTime: start,
    })
    log('mediaSlice.ts', `Playing segment from ${start} to ${end}`)
  },

  stopSegmentPlayback: () => {
    set({
      isSegmentPlayback: false,
      isPlaying: false,
      segmentStart: null,
      segmentEnd: null,
    })
    log('mediaSlice.ts', 'Segment playback stopped')
  },

  // Subtitle actions
  toggleSubtitles: () => {
    set((state) => ({ showSubtitles: !state.showSubtitles }))
  },

  setSubtitleSize: (size) => {
    set({ subtitleSize: size })
  },

  setSubtitlePosition: (position) => {
    set({ subtitlePosition: position })
  },
})
