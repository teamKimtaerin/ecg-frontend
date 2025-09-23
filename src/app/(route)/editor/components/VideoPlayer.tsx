'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useEditorStore } from '../store'
import { videoSegmentManager } from '@/utils/video/segmentManager'
import {
  findCurrentWord, // eslint-disable-line @typescript-eslint/no-unused-vars
  shouldUpdateWordSelection, // eslint-disable-line @typescript-eslint/no-unused-vars
} from '@/utils/video/currentWordFinder'

interface VideoPlayerProps {
  className?: string
  onTimeUpdate?: (currentTime: number) => void
  onLoadedMetadata?: (duration: number) => void
}

const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ className = '', onTimeUpdate, onLoadedMetadata }, ref) => {
    // videoRef를 외부 ref와 내부 ref를 모두 처리할 수 있도록 수정
    const internalRef = useRef<HTMLVideoElement>(null)
    const videoRef = (ref as React.RefObject<HTMLVideoElement>) || internalRef
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isToggling, setIsToggling] = useState(false)
    const [videoError, setVideoError] = useState<string | null>(null)

    const {
      videoUrl,
      isSegmentPlayback,
      segmentStart,
      segmentEnd,
      stopSegmentPlayback,
      clips,
      deletedClipIds,
      setFocusedWord, // eslint-disable-line @typescript-eslint/no-unused-vars
      setActiveClipId, // eslint-disable-line @typescript-eslint/no-unused-vars
      setPlayingWord, // eslint-disable-line @typescript-eslint/no-unused-vars
      clearPlayingWord, // eslint-disable-line @typescript-eslint/no-unused-vars
    } = useEditorStore()

    // Track last word selection update time to throttle updates
    const lastWordUpdateTimeRef = useRef(0) // eslint-disable-line @typescript-eslint/no-unused-vars
    // Track when user manually selects a word to pause auto selection
    const manualSelectionPauseUntilRef = useRef(0)
    // Track src changes to ignore transient error events during swaps
    const lastSrcChangeAtRef = useRef(0)
    const lastErrorLogAtRef = useRef(0)

    // MediaError code to message mapping
    const getMediaErrorMessage = useCallback(
      (errorCode: number | undefined): string => {
        switch (errorCode) {
          case 1: // MEDIA_ERR_ABORTED
            return '비디오 로드가 중단되었습니다'
          case 2: // MEDIA_ERR_NETWORK
            return '네트워크 오류로 비디오를 로드할 수 없습니다'
          case 3: // MEDIA_ERR_DECODE
            return '비디오 디코딩 중 오류가 발생했습니다'
          case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
            return '비디오 형식이 지원되지 않거나 소스를 찾을 수 없습니다'
          default:
            return '알 수 없는 비디오 오류가 발생했습니다'
        }
      },
      []
    )

    // Enhanced error handler
    const handleVideoError = useCallback(
      (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget as HTMLVideoElement
        const error = video.error || undefined
        const errorCode = error?.code
        const errorMessage = getMediaErrorMessage(errorCode)

        // Ignore transient errors right after src changes
        const now = Date.now()
        if (now - lastSrcChangeAtRef.current < 800) {
          // Likely emitted while swapping sources; ignore noise
          return
        }

        // Throttle noisy repeated logs
        if (now - lastErrorLogAtRef.current < 500) return
        lastErrorLogAtRef.current = now

        const details = {
          errorCode,
          errorName:
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (error as any)?.name || undefined,
          errorMessage,
          originalMessage:
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (error as any)?.message || undefined,
          videoUrl,
          urlType: videoUrl?.startsWith('blob:')
            ? 'blob'
            : videoUrl?.startsWith('http')
              ? 'http'
              : 'unknown',
          readyState: video.readyState,
          networkState: video.networkState,
          currentSrc: video.currentSrc,
          timestamp: new Date().toISOString(),
        }

        try {
          console.error(
            '[VideoPlayer] Video error details:',
            JSON.stringify(details)
          )
        } catch {
          console.error('[VideoPlayer] Video error details:', details)
        }

        setVideoError(errorMessage)

        // Special handling for Blob URL expiration or invalid persisted blob
        if (
          (errorCode === 4 || errorCode == null) &&
          videoUrl?.startsWith('blob:')
        ) {
          console.warn(
            '[VideoPlayer] Blob URL may be invalid/expired - suggesting re-upload'
          )
          setVideoError(
            '업로드한 비디오를 재생할 수 없습니다. 파일을 다시 업로드해주세요.'
          )
        }
      },
      [videoUrl, getMediaErrorMessage]
    )

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

        // Auto-select current word during playback (temporarily disabled for debugging)
        // TODO: Re-enable after fixing video playback issues
        /*
      if (
        isPlaying && 
        clips.length > 0 &&
        time > manualSelectionPauseUntilRef.current &&
        shouldUpdateWordSelection(time, lastWordUpdateTimeRef.current)
      ) {
        try {
          const currentWordInfo = findCurrentWord(time, clips)
          if (currentWordInfo) {
            setPlayingWord(currentWordInfo.clipId, currentWordInfo.wordId)
            
            const currentFocusedWordId = useEditorStore.getState().focusedWordId
            const currentFocusedClipId = useEditorStore.getState().focusedClipId
            
            if (
              currentFocusedWordId !== currentWordInfo.wordId ||
              currentFocusedClipId !== currentWordInfo.clipId
            ) {
              setFocusedWord(currentWordInfo.clipId, currentWordInfo.wordId)
              setActiveClipId(currentWordInfo.clipId)
            }
          } else {
            clearPlayingWord()
          }
          lastWordUpdateTimeRef.current = time
        } catch (error) {
          console.warn('Word synchronization error:', error)
        }
      } else if (!isPlaying) {
        clearPlayingWord()
      }
      */

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
      videoRef, // Added to satisfy ESLint dependency check
      // setFocusedWord, setActiveClipId, setPlayingWord, clearPlayingWord - unused in current implementation
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
    }, [onLoadedMetadata, clips, videoRef]) // Added videoRef to satisfy ESLint

    // Play/Pause toggle with debounce to prevent rapid clicks
    const togglePlayPause = useCallback(
      async (e?: React.MouseEvent) => {
        console.log('🎥 VIDEO PLAYER CLICKED:', {
          isPlaying,
          isToggling,
          event: e ? 'mouse_click' : 'keyboard_shortcut',
          target: e?.target,
          currentTarget: e?.currentTarget,
        })

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
            // Clear text selection when video starts playing
            useEditorStore.getState().clearSelection()
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
      },
      [isPlaying, isToggling, videoRef] // Added videoRef to satisfy ESLint
    )

    // Seek to specific time
    const seekTo = useCallback(
      (time: number) => {
        if (videoRef.current && time >= 0 && time <= duration) {
          videoRef.current.currentTime = time
          setCurrentTime(time)
        }
      },
      [duration, videoRef] // Added videoRef to satisfy ESLint
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
    }, [isSegmentPlayback, segmentStart, videoRef]) // Added videoRef to satisfy ESLint

    // Function to pause auto word selection temporarily
    const pauseAutoWordSelection = useCallback(() => {
      const currentTime = videoRef.current?.currentTime || 0
      // Pause auto selection for 3 seconds after manual word selection
      manualSelectionPauseUntilRef.current = currentTime + 3
    }, [videoRef]) // Added videoRef to satisfy ESLint

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
              pauseAutoWordSelection: () => void
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
          pauseAutoWordSelection,
        }
      }
    }, [seekTo, pauseAutoWordSelection, videoRef]) // Added videoRef to satisfy ESLint

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

    // Handle video URL changes with proper cleanup and reset
    useEffect(() => {
      lastSrcChangeAtRef.current = Date.now()
      console.log('[VideoPlayer] Video URL changed:', {
        videoUrl,
        isBlobUrl: videoUrl?.startsWith('blob:'),
        urlLength: videoUrl?.length,
        timestamp: new Date().toISOString(),
      })

      // If we have a video element and the URL changed, force a reset
      if (videoRef.current) {
        const video = videoRef.current
        console.log('🔄 Forcing video element reset for new URL')

        // Stop current playback
        video.pause()
        setIsPlaying(false)

        // Clear current source to force reload
        video.removeAttribute('src')
        video.load()

        // If we have a new URL, set it after a brief delay to ensure cleanup
        if (videoUrl) {
          setTimeout(() => {
            if (videoRef.current && videoUrl) {
              console.log('📺 Setting new video source:', videoUrl)
              videoRef.current.src = videoUrl
              videoRef.current.load()
            }
          }, 50)
        }
      }
    }, [videoUrl])

    // Error state
    if (videoError) {
      return (
        <div
          className={`flex items-center justify-center bg-black text-red-400 ${className}`}
        >
          <div className="text-center p-4">
            <svg
              className="w-12 h-12 mx-auto mb-2 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-sm font-medium mb-2">비디오 오류</p>
            <p className="text-xs text-red-300 mb-4">{videoError}</p>
            <button
              onClick={() => {
                setVideoError(null)
                if (videoRef.current) {
                  videoRef.current.load() // Reload video
                }
              }}
              className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      )
    }

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
          playsInline
          controls={false}
          className="w-full h-full object-contain"
          onClick={(e) => togglePlayPause(e)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => {
            setIsPlaying(true)
            // Clear text selection when video starts playing
            useEditorStore.getState().clearSelection()
          }}
          onPause={() => setIsPlaying(false)}
          onError={handleVideoError}
          onLoadStart={() => {
            console.log('[VideoPlayer] Video loading started:', videoUrl)
            setVideoError(null) // Clear any previous errors
          }}
          onCanPlay={() => {
            console.log('[VideoPlayer] Video can play:', {
              videoUrl,
              duration: videoRef.current?.duration,
              readyState: videoRef.current?.readyState,
            })
            setVideoError(null) // Clear errors when video can play
          }}
        />
      </div>
    )
  }
)

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer
