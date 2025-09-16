'use client'

import React, { useCallback, useEffect, useState } from 'react'
// import { useEditorStore } from '../../store/editorStore' // Unused import
import { VirtualTimelineProgressBar } from './VirtualTimelineProgressBar'
import { VirtualTimeControls } from './VirtualTimeControls'
import { VirtualSegmentVisualization } from './VirtualSegmentVisualization'
import {
  PlayIcon,
  PauseIcon,
  VolumeIcon,
  VolumeOffIcon,
} from '@/components/icons'
import Button from '@/components/ui/Button'
import Slider from '@/components/ui/Slider'
import { VirtualPlayerController } from '@/utils/virtual-timeline/VirtualPlayerController'
import type { VirtualSegment } from '@/utils/virtual-timeline/types'

interface VirtualTimelineVideoControllerProps {
  className?: string
  onVirtualTimeUpdate?: (virtualTime: number, duration: number) => void
  showSegmentVisualization?: boolean
  showVolumeControls?: boolean
  virtualPlayerController?: VirtualPlayerController | null
}

export const VirtualTimelineVideoController: React.FC<
  VirtualTimelineVideoControllerProps
> = ({
  className = '',
  onVirtualTimeUpdate,
  showSegmentVisualization = true,
  showVolumeControls = true,
  virtualPlayerController = null,
}) => {
  // Store hooks
  // const { clips } = useEditorStore() // Unused variable

  // Virtual Timeline 상태 (실제 Virtual Player Controller에서 가져옴)
  const [virtualTime, setVirtualTime] = useState(0)
  const [virtualDuration, setVirtualDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [segments, setSegments] = useState<VirtualSegment[]>([])

  // Virtual Player Controller 함수들
  const playVirtualTimeline = useCallback(async () => {
    if (virtualPlayerController) {
      await virtualPlayerController.play()
    }
  }, [virtualPlayerController])

  const pauseVirtualTimeline = useCallback(() => {
    if (virtualPlayerController) {
      virtualPlayerController.pause()
    }
  }, [virtualPlayerController])

  const seekVirtualTimeline = useCallback(
    (time: number) => {
      if (virtualPlayerController) {
        virtualPlayerController.seek(time)
      }
    },
    [virtualPlayerController]
  )

  // Local state for UI
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  // const [showVolumeSlider, setShowVolumeSlider] = useState(false) // Unused state
  const [playbackRate, setPlaybackRate] = useState(1)

  // Virtual Player Controller 상태 동기화
  useEffect(() => {
    if (virtualPlayerController) {
      // Virtual Player Controller의 상태를 실시간으로 가져오기 위한 콜백 등록
      const unsubscribeTimeUpdate = virtualPlayerController.onTimeUpdate(
        (time) => {
          setVirtualTime(time)
          onVirtualTimeUpdate?.(time, virtualDuration)
        }
      )

      const unsubscribePlay = virtualPlayerController.onPlay(() => {
        setIsPlaying(true)
      })

      const unsubscribePause = virtualPlayerController.onPause(() => {
        setIsPlaying(false)
      })

      const unsubscribeStop = virtualPlayerController.onStop(() => {
        setIsPlaying(false)
        setVirtualTime(0)
      })

      // Virtual Timeline 정보 가져오기
      const duration = virtualPlayerController.getDuration()
      setVirtualDuration(duration)

      // Timeline 변경 시 세그먼트 업데이트
      const unsubscribeTimelineChange =
        virtualPlayerController.onTimelineChange((timeline) => {
          console.log('🎬 [VirtualTimelineVideoController] Timeline changed:', {
            segments: timeline.segments?.length || 0,
            enabledSegments:
              timeline.segments?.filter((s) => s.isEnabled).length || 0,
            duration: timeline.duration || 0,
          })

          setSegments(timeline.segments || [])
          setVirtualDuration(timeline.duration || 0)

          // 현재 Virtual Time이 새로운 타임라인에서 유효한지 확인
          if (virtualTime > (timeline.duration || 0)) {
            console.log(
              '⚠️ [VirtualTimelineVideoController] Current virtual time exceeds new timeline duration, resetting'
            )
            setVirtualTime(0)
          }
        })

      return () => {
        unsubscribeTimeUpdate()
        unsubscribePlay()
        unsubscribePause()
        unsubscribeStop()
        unsubscribeTimelineChange()
      }
    }
  }, [virtualPlayerController, onVirtualTimeUpdate, virtualDuration])

  // Format virtual time for display
  const formatVirtualTime = useCallback(
    (seconds: number): string => {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = Math.floor(seconds % 60)

      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    },
    [virtualTime]
  ) // Include virtualTime dependency as recommended by ESLint

  // Virtual timeline control handlers
  const handleVirtualPlayPause = useCallback(async () => {
    try {
      if (isPlaying) {
        pauseVirtualTimeline()
      } else {
        await playVirtualTimeline()
      }
    } catch (error) {
      console.warn('Virtual timeline play/pause failed:', error)
    }
  }, [isPlaying, playVirtualTimeline, pauseVirtualTimeline])

  const handleVirtualSeek = useCallback(
    (virtualTime: number) => {
      if (virtualTime >= 0 && virtualTime <= virtualDuration) {
        seekVirtualTimeline(virtualTime)
      }
    },
    [virtualDuration, seekVirtualTimeline]
  )

  // Volume control handlers
  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      setVolume(newVolume)
      // Virtual Player Controller는 볼륨 제어 없음 (HTML5 Video에 직접 적용)
      // TODO: 필요하면 HTML5 video element 참조로 볼륨 제어

      if (newVolume === 0 && !isMuted) {
        setIsMuted(true)
      } else if (newVolume > 0 && isMuted) {
        setIsMuted(false)
      }
    },
    [isMuted]
  )

  const toggleMute = useCallback(() => {
    if (isMuted) {
      const restoreVolume = volume > 0 ? volume : 1
      handleVolumeChange(restoreVolume)
    } else {
      handleVolumeChange(0)
    }
  }, [isMuted, volume, handleVolumeChange])

  // Playback rate control
  const handlePlaybackRateChange = useCallback(
    (rate: number) => {
      setPlaybackRate(rate)
      if (virtualPlayerController) {
        virtualPlayerController.setPlaybackRate(rate)
      }
    },
    [virtualPlayerController]
  )

  // Keyboard shortcuts for virtual timeline
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          handleVirtualPlayPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handleVirtualSeek(virtualTime - 5)
          break
        case 'ArrowRight':
          e.preventDefault()
          handleVirtualSeek(virtualTime + 5)
          break
        case 'Home':
          e.preventDefault()
          handleVirtualSeek(0)
          break
        case 'End':
          e.preventDefault()
          handleVirtualSeek(virtualDuration)
          break
        case 'm':
        case 'M':
          e.preventDefault()
          toggleMute()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [
    handleVirtualPlayPause,
    handleVirtualSeek,
    virtualTime,
    virtualDuration,
    toggleMute,
  ])

  // Notify parent of virtual time updates
  useEffect(() => {
    onVirtualTimeUpdate?.(virtualTime, virtualDuration)
  }, [virtualTime, virtualDuration, onVirtualTimeUpdate])

  const playbackRateOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]

  return (
    <div
      className={`virtual-timeline-controller bg-white border border-gray-200 rounded-lg p-3 ${className}`}
    >
      {/* Segment Visualization - more compact */}
      {showSegmentVisualization && (
        <VirtualSegmentVisualization
          segments={segments}
          currentTime={virtualTime}
          duration={virtualDuration}
          onSeek={handleVirtualSeek}
          className="mb-3"
          height={30}
        />
      )}

      {/* Main Progress Bar */}
      <VirtualTimelineProgressBar
        currentTime={virtualTime}
        duration={virtualDuration}
        segments={segments}
        onSeek={handleVirtualSeek}
        className="mb-3"
        height={6}
      />

      {/* Control Bar */}
      <div className="flex items-center justify-between text-gray-700">
        {/* Left Side - Play Controls */}
        <div className="flex items-center gap-3">
          {/* Play/Pause Button */}
          <Button
            variant="primary"
            size="small"
            onClick={handleVirtualPlayPause}
            className="text-gray-700 hover:bg-gray-100"
          >
            {isPlaying ? (
              <PauseIcon className="w-6 h-6" />
            ) : (
              <PlayIcon className="w-6 h-6" />
            )}
          </Button>

          {/* Advanced Time Controls */}
          <VirtualTimeControls
            currentTime={virtualTime}
            duration={virtualDuration}
            onSeek={handleVirtualSeek}
            className="mx-4"
          />
        </div>

        {/* Right Side - Volume Controls */}
        {showVolumeControls && (
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <Button
              variant="primary"
              size="small"
              onClick={toggleMute}
              className="text-gray-700 hover:bg-gray-100"
            >
              {isMuted || volume === 0 ? (
                <VolumeOffIcon className="w-5 h-5" />
              ) : (
                <VolumeIcon className="w-5 h-5" />
              )}
            </Button>

            {/* Volume Slider */}
            <div className="w-20">
              <Slider
                value={isMuted ? 0 : volume}
                onChange={(newVolume: number) => handleVolumeChange(newVolume)}
                maxValue={1}
                step={0.01}
                className="cursor-pointer"
              />
            </div>

            {/* Playback Rate */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 whitespace-nowrap">속도:</span>
              <select
                value={playbackRate}
                onChange={(e) =>
                  handlePlaybackRateChange(Number(e.target.value))
                }
                className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
              >
                {playbackRateOptions.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}x
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Virtual Timeline Info */}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <span>총 세그먼트: {segments.length}</span>
          <span>
            활성 세그먼트: {segments.filter((s) => s.isEnabled).length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            {formatVirtualTime(virtualTime)} /{' '}
            {formatVirtualTime(virtualDuration)}
          </span>
          <span>재생 속도: {playbackRate}x</span>
        </div>
      </div>
    </div>
  )
}

export default VirtualTimelineVideoController
