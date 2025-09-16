'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useEditorStore } from '../store'
import { videoSegmentManager } from '@/utils/video/segmentManager'

interface VideoPlayerProps {
  className?: string
  onTimeUpdate?: (currentTime: number) => void
  onLoadedMetadata?: (duration: number) => void
}

export default function VideoPlayer({
  className = '',
  onTimeUpdate,
  onLoadedMetadata,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isToggling, setIsToggling] = useState(false)

  const {
    videoUrl,
    isSegmentPlayback,
    segmentStart,
    segmentEnd,
    stopSegmentPlayback,
    clips,
    deletedClipIds,
  } = useEditorStore()

  // Handle time update
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime
      setCurrentTime(time)
      onTimeUpdate?.(time)

      // Update store with current time
      useEditorStore.getState().setMediaInfo({
        currentTime: time,
      })

      // Check segment playback boundaries
      if (isSegmentPlayback && segmentEnd !== null && time >= segmentEnd) {
        videoRef.current.pause()
        videoRef.current.currentTime = segmentStart || 0
        stopSegmentPlayback()
      }
    }
  }, [
    onTimeUpdate,
    isSegmentPlayback,
    segmentStart,
    segmentEnd,
    stopSegmentPlayback,
  ])

  // Handle loaded metadata
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration
      setDuration(videoDuration)
      onLoadedMetadata?.(videoDuration)

      // Update store with duration
      useEditorStore.getState().setMediaInfo({
        videoDuration,
      })

      // Initialize segment manager once we have duration and clips
      if (clips.length > 0 && Number.isFinite(videoDuration)) {
        videoSegmentManager.initialize(clips, videoDuration)
      }
    }
  }, [onLoadedMetadata, clips])

  // Play/Pause toggle with debounce to prevent rapid clicks
  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current || isToggling) return

    setIsToggling(true)

    try {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
        useEditorStore.getState().setMediaInfo({
          isPlaying: false,
        })
      } else {
        // Handle play() promise properly
        await videoRef.current.play()
        setIsPlaying(true)
        useEditorStore.getState().setMediaInfo({
          isPlaying: true,
        })
      }
    } catch (error) {
      // AbortError는 무시 (이미 다른 play/pause가 진행중)
      if (error instanceof Error && error.name !== 'AbortError') {
        console.warn('Video play/pause failed:', error)
      }
      // Reset state on error
      setIsPlaying(videoRef.current.paused === false)
      useEditorStore.getState().setMediaInfo({
        isPlaying: videoRef.current.paused === false,
      })
    } finally {
      // 짧은 지연 후 다시 토글 가능하도록
      setTimeout(() => setIsToggling(false), 100)
    }
  }, [isPlaying, isToggling])

  // Seek to specific time
  const seekTo = useCallback(
    (time: number) => {
      if (videoRef.current && time >= 0 && time <= duration) {
        videoRef.current.currentTime = time
        setCurrentTime(time)
      }
    },
    [duration]
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlayPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          seekTo(currentTime - 5)
          break
        case 'ArrowRight':
          e.preventDefault()
          seekTo(currentTime + 5)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [togglePlayPause, seekTo, currentTime])

  // Handle segment playback control
  useEffect(() => {
    if (isSegmentPlayback && segmentStart !== null && videoRef.current) {
      videoRef.current.currentTime = segmentStart
      videoRef.current.play().catch((err) => {
        console.warn('Failed to start segment playback:', err)
      })
    }
  }, [isSegmentPlayback, segmentStart])

  // Expose methods to parent via ref (optional)
  useEffect(() => {
    // Store video ref globally for external control
    if (videoRef.current) {
      ;(
        window as {
          videoPlayer?: {
            play: () => void
            pause: () => void
            seekTo: (time: number) => void
            getCurrentTime: () => number
            playSegment: (start: number, end: number) => void
          }
        }
      ).videoPlayer = {
        play: () => videoRef.current?.play(),
        pause: () => videoRef.current?.pause(),
        seekTo,
        getCurrentTime: () => videoRef.current?.currentTime || 0,
        playSegment: (start: number, end: number) => {
          useEditorStore.getState().playSegment(start, end)
        },
      }
    }
  }, [seekTo])

  // Update segment manager when clips or duration change
  useEffect(() => {
    if (clips.length > 0 && duration > 0) {
      videoSegmentManager.initialize(clips, duration)
    }
  }, [clips, duration])

  // Handle deleted clips
  useEffect(() => {
    if (deletedClipIds) {
      videoSegmentManager.clearDeletions()
      deletedClipIds.forEach((clipId) => {
        videoSegmentManager.deleteClip(clipId)
      })
    }
  }, [deletedClipIds])

  if (!videoUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-black text-gray-500 ${className}`}
      >
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm">No video loaded</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative bg-black ${className}`}>
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlayPause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  )
}
