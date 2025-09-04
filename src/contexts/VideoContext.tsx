'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

// 타입 정의
interface TimingSyncData {
  version: string
  created_at: string
  total_duration: number
  sync_precision_ms: number
  sync_events: Array<{
    timestamp: number
    event_type: string
    content?: string
  }>
}

interface VideoState {
  videoFile: File | null
  videoUrl: string | null
  captionData: TimingSyncData | null
  isPlaying: boolean
  currentTime: number
  duration: number
}

interface VideoActions {
  setVideoFile: (file: File | null) => void
  setVideoUrl: (url: string | null) => void
  setCaptionData: (data: TimingSyncData | null) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  resetVideo: () => void
}

type VideoContextType = VideoState & VideoActions

const VideoContext = createContext<VideoContextType | undefined>(undefined)

const initialState: VideoState = {
  videoFile: null,
  videoUrl: null,
  captionData: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
}

export function VideoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VideoState>(initialState)

  const setVideoFile = (file: File | null) => {
    setState((prev) => ({ ...prev, videoFile: file }))
    if (file) {
      const url = URL.createObjectURL(file)
      setState((prev) => ({ ...prev, videoUrl: url }))
    }
  }

  const setVideoUrl = (url: string | null) => {
    setState((prev) => ({ ...prev, videoUrl: url }))
  }

  const setCaptionData = (data: TimingSyncData | null) => {
    setState((prev) => ({ ...prev, captionData: data }))
  }

  const setIsPlaying = (playing: boolean) => {
    setState((prev) => ({ ...prev, isPlaying: playing }))
  }

  const setCurrentTime = (time: number) => {
    setState((prev) => ({ ...prev, currentTime: time }))
  }

  const setDuration = (duration: number) => {
    setState((prev) => ({ ...prev, duration }))
  }

  const resetVideo = () => {
    if (state.videoUrl && state.videoFile) {
      URL.revokeObjectURL(state.videoUrl)
    }
    setState(initialState)
  }

  const contextValue: VideoContextType = {
    ...state,
    setVideoFile,
    setVideoUrl,
    setCaptionData,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    resetVideo,
  }

  return (
    <VideoContext.Provider value={contextValue}>
      {children}
    </VideoContext.Provider>
  )
}

export function useVideo() {
  const context = useContext(VideoContext)
  if (context === undefined) {
    throw new Error('useVideo must be used within a VideoProvider')
  }
  return context
}
