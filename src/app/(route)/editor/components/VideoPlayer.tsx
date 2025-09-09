'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useEditorStore } from '../store'

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
  const [showControls, setShowControls] = useState(true)
  const [isToggling, setIsToggling] = useState(false)

  const { videoUrl, videoName } = useEditorStore()

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
    }
  }, [onTimeUpdate])

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
    }
  }, [onLoadedMetadata])

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

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

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
          }
        }
      ).videoPlayer = {
        play: () => videoRef.current?.play(),
        pause: () => videoRef.current?.pause(),
        seekTo,
        getCurrentTime: () => videoRef.current?.currentTime || 0,
      }
    }
  }, [seekTo])

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
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      />

      {/* Custom Controls Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        onMouseEnter={() => setShowControls(true)}
      >
        {/* Progress Bar */}
        <div className="mb-3">
          <div
            className="relative h-1 bg-gray-600 rounded-full cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const percent = (e.clientX - rect.left) / rect.width
              seekTo(percent * duration)
            }}
          >
            <div
              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className="text-white hover:text-blue-400 transition-colors"
            >
              {isPlaying ? (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Time Display */}
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Video Title */}
          <div className="text-white text-sm truncate max-w-[200px]">
            {videoName || 'Video'}
          </div>
        </div>
      </div>
    </div>
  )
}
