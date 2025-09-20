'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useEditorStore } from '../store'
import { VirtualPlayerController } from '@/utils/virtual-timeline/VirtualPlayerController'

interface VirtualTimelineControllerProps {
  virtualPlayerController?: VirtualPlayerController | null
}

const VirtualTimelineController: React.FC<VirtualTimelineControllerProps> = ({
  virtualPlayerController,
}) => {
  const { videoUrl } = useEditorStore()
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // 비디오 요소에서 현재 시간 가져오기
  const getVideoElement = (): HTMLVideoElement | null => {
    return document.querySelector('video')
  }

  // 총 재생 시간 계산
  const calculateTotalDuration = useCallback((): number => {
    const video = getVideoElement()
    return video?.duration || 0
  }, [])

  // 시간 포맷팅 (mm:ss.f)
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    const wholeSeconds = Math.floor(remainingSeconds)
    const fraction = Math.floor((remainingSeconds - wholeSeconds) * 10)
    return `${minutes.toString().padStart(2, '0')}:${wholeSeconds.toString().padStart(2, '0')}.${fraction}`
  }, [])

  // Virtual Timeline 또는 비디오 시간 업데이트 감지
  useEffect(() => {
    if (virtualPlayerController) {
      // Virtual Timeline 콜백 등록
      const timeUpdateCleanup = virtualPlayerController.onTimeUpdate(
        (virtualTime) => {
          setCurrentTime(virtualTime)
        }
      )

      const playCleanup = virtualPlayerController.onPlay(() => {
        setIsPlaying(true)
      })

      const pauseCleanup = virtualPlayerController.onPause(() => {
        setIsPlaying(false)
      })

      const stopCleanup = virtualPlayerController.onStop(() => {
        setIsPlaying(false)
      })

      // 초기값 설정
      setCurrentTime(virtualPlayerController.getCurrentTime())

      return () => {
        timeUpdateCleanup()
        playCleanup()
        pauseCleanup()
        stopCleanup()
      }
    } else {
      // Fallback: HTML5 비디오 이벤트 감지
      const video = getVideoElement()
      if (!video) return

      const updateTime = () => {
        setCurrentTime(video.currentTime)
      }

      const updateDuration = () => {
        setTotalDuration(calculateTotalDuration())
      }

      const updatePlayState = () => {
        setIsPlaying(!video.paused)
      }

      video.addEventListener('timeupdate', updateTime)
      video.addEventListener('loadedmetadata', updateDuration)
      video.addEventListener('play', updatePlayState)
      video.addEventListener('pause', updatePlayState)

      // 초기값 설정
      updateTime()
      updateDuration()
      updatePlayState()

      return () => {
        video.removeEventListener('timeupdate', updateTime)
        video.removeEventListener('loadedmetadata', updateDuration)
        video.removeEventListener('play', updatePlayState)
        video.removeEventListener('pause', updatePlayState)
      }
    }
  }, [virtualPlayerController, calculateTotalDuration])

  // 비디오 duration 업데이트
  useEffect(() => {
    setTotalDuration(calculateTotalDuration())
  }, [calculateTotalDuration])

  // 슬라이더로 재생 위치 이동
  const handleSeek = useCallback(
    async (value: number) => {
      const seekTime = Math.max(0, Math.min(value, totalDuration))

      if (!virtualPlayerController) {
        // Fallback to HTML5 video
        const video = getVideoElement()
        if (video) {
          video.currentTime = seekTime
        }
        return
      }

      try {
        await virtualPlayerController.seek(seekTime)
      } catch (error) {
        console.error('Virtual Timeline seek failed:', error)
      }
    },
    [virtualPlayerController, totalDuration]
  )

  // 재생/일시정지 컨트롤 (Virtual Timeline 사용)
  const handlePlayPause = useCallback(async () => {
    if (!virtualPlayerController) {
      // Fallback to HTML5 video if Virtual Timeline not available
      const video = getVideoElement()
      if (!video) return

      if (isPlaying) {
        video.pause()
      } else {
        video.play().catch((error) => {
          console.error('Video play failed:', error)
        })
      }
      return
    }

    try {
      if (isPlaying) {
        await virtualPlayerController.pause()
      } else {
        await virtualPlayerController.play()
      }
    } catch (error) {
      console.error('Virtual Timeline play/pause failed:', error)
    }
  }, [virtualPlayerController, isPlaying])

  // 정지 버튼 (처음으로 이동 + 일시정지)
  const handleStop = useCallback(async () => {
    if (!virtualPlayerController) {
      // Fallback to HTML5 video
      const video = getVideoElement()
      if (!video) return

      video.pause()
      video.currentTime = 0
      return
    }

    try {
      await virtualPlayerController.pause()
      await virtualPlayerController.seek(0)
    } catch (error) {
      console.error('Virtual Timeline stop failed:', error)
    }
  }, [virtualPlayerController])

  if (!videoUrl) {
    return null
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
      {/* 컨트롤 바 */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">타임라인</span>

          {/* 재생 컨트롤 */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePlayPause}
              className={`p-1.5 rounded-full transition-all duration-200 ${
                isPlaying
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              title={isPlaying ? '일시정지' : '재생'}
            >
              {isPlaying ? (
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg
                  className="w-3 h-3 ml-0.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={handleStop}
              className="p-1.5 bg-white border border-gray-300 text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
              title="정지"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* 재생 상태 표시 */}
          <div
            className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-purple-500' : 'bg-gray-400'}`}
          />
          <div className="text-xs text-gray-500 font-mono">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </div>
        </div>
      </div>

      {/* 슬라이더 영역 */}
      <div className="px-4 py-3 bg-white">
        <div className="relative">
          {/* Custom Slider Track */}
          <div
            className="relative h-2 bg-gray-200 rounded-full cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const clickX = e.clientX - rect.left
              const percentage = clickX / rect.width
              const newTime = percentage * totalDuration
              handleSeek(newTime)
            }}
          >
            {/* Progress Fill */}
            <div
              className="absolute top-0 left-0 h-full bg-purple-400 rounded-full"
              style={{
                width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%`,
              }}
            />

            {/* Rectangular Handle */}
            <div
              className="absolute w-3 h-6 bg-purple-600 border-2 border-white shadow-md cursor-grab active:cursor-grabbing transform -translate-x-1/2 transition-all duration-200 hover:bg-purple-700 hover:scale-110"
              style={{
                left: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%`,
                top: '-8px',
                borderRadius: '2px',
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                const startX = e.clientX
                const startTime = currentTime
                const trackRect =
                  e.currentTarget.parentElement?.getBoundingClientRect()

                const handleMouseMove = (moveEvent: MouseEvent) => {
                  if (!trackRect) return
                  const deltaX = moveEvent.clientX - startX
                  const deltaPercentage = deltaX / trackRect.width
                  const deltaTime = deltaPercentage * totalDuration
                  const newTime = Math.max(
                    0,
                    Math.min(totalDuration, startTime + deltaTime)
                  )
                  handleSeek(newTime)
                }

                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove)
                  document.removeEventListener('mouseup', handleMouseUp)
                }

                document.addEventListener('mousemove', handleMouseMove)
                document.addEventListener('mouseup', handleMouseUp)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default VirtualTimelineController
