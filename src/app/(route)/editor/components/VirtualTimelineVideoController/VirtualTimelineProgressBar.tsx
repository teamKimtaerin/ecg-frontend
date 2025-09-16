'use client'

import React, { useCallback, useRef, useState } from 'react'
import { VirtualSegment } from '@/utils/virtual-timeline/types'

interface VirtualTimelineProgressBarProps {
  currentTime: number
  duration: number
  segments: VirtualSegment[]
  onSeek: (virtualTime: number) => void
  className?: string
  height?: number
  showSegmentBorders?: boolean
}

export const VirtualTimelineProgressBar: React.FC<
  VirtualTimelineProgressBarProps
> = ({
  currentTime,
  duration,
  segments,
  onSeek,
  className = '',
  height = 8,
  showSegmentBorders = true,
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)

  // Calculate current progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  // Get active (enabled) segments for visualization
  const activeSegments = segments.filter((segment) => segment.isEnabled)

  // Calculate segment positions and colors
  const getSegmentStyle = useCallback(
    (segment: VirtualSegment) => {
      if (duration === 0) return { left: '0%', width: '0%' }

      const startPercentage = (segment.virtualStartTime / duration) * 100
      const widthPercentage =
        ((segment.virtualEndTime - segment.virtualStartTime) / duration) * 100

      // Color coding for different segment types
      const getSegmentColor = (type: string) => {
        switch (type) {
          case 'split':
            return 'bg-blue-400'
          case 'moved':
            return 'bg-green-400'
          default:
            return 'bg-gray-500'
        }
      }

      return {
        left: `${startPercentage}%`,
        width: `${widthPercentage}%`,
        backgroundColor: '',
        className: getSegmentColor(segment.type),
      }
    },
    [duration]
  )

  // Handle click to seek
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || duration === 0) return

      const rect = progressBarRef.current.getBoundingClientRect()
      const clickPosition = (e.clientX - rect.left) / rect.width
      const newVirtualTime = Math.max(
        0,
        Math.min(duration, clickPosition * duration)
      )

      onSeek(newVirtualTime)
    },
    [duration, onSeek]
  )

  // Handle drag start
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(true)
      handleProgressClick(e)

      // Add global mouse move and up listeners
      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!progressBarRef.current || duration === 0) return

        const rect = progressBarRef.current.getBoundingClientRect()
        const dragPosition = Math.max(
          0,
          Math.min(1, (moveEvent.clientX - rect.left) / rect.width)
        )
        const newVirtualTime = dragPosition * duration

        onSeek(newVirtualTime)
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [duration, handleProgressClick, onSeek]
  )

  // Handle hover for time preview
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || duration === 0) return

      const rect = progressBarRef.current.getBoundingClientRect()
      const hoverPosition = (e.clientX - rect.left) / rect.width
      const hoverVirtualTime = Math.max(
        0,
        Math.min(duration, hoverPosition * duration)
      )

      setHoverTime(hoverVirtualTime)
    },
    [duration]
  )

  const handleMouseLeave = useCallback(() => {
    setHoverTime(null)
  }, [])

  // Format time for hover tooltip
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Find which segment contains a given virtual time
  const getSegmentAtTime = useCallback(
    (virtualTime: number): VirtualSegment | null => {
      return (
        activeSegments.find(
          (segment) =>
            virtualTime >= segment.virtualStartTime &&
            virtualTime < segment.virtualEndTime
        ) || null
      )
    },
    [activeSegments]
  )

  const currentSegment = getSegmentAtTime(currentTime)
  const hoverSegment = hoverTime !== null ? getSegmentAtTime(hoverTime) : null

  return (
    <div className={`virtual-timeline-progress-bar ${className}`}>
      {/* Timeline Track */}
      <div
        ref={progressBarRef}
        className={`relative bg-gray-700 rounded-full cursor-pointer overflow-hidden`}
        style={{ height: `${height}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleProgressClick}
      >
        {/* Background segments visualization */}
        {showSegmentBorders &&
          activeSegments.map((segment) => {
            const style = getSegmentStyle(segment)
            return (
              <div
                key={segment.id}
                className={`absolute h-full ${style.className} opacity-30`}
                style={{
                  left: style.left,
                  width: style.width,
                }}
              />
            )
          })}

        {/* Gaps between segments (deleted clips visualization) */}
        {showSegmentBorders &&
          activeSegments.length > 1 &&
          activeSegments.map((segment, index) => {
            if (index === activeSegments.length - 1) return null

            const nextSegment = activeSegments[index + 1]
            const gapStart = segment.virtualEndTime
            const gapEnd = nextSegment.virtualStartTime

            if (gapEnd > gapStart) {
              const gapStartPercentage = (gapStart / duration) * 100
              const gapWidthPercentage = ((gapEnd - gapStart) / duration) * 100

              return (
                <div
                  key={`gap-${segment.id}-${nextSegment.id}`}
                  className="absolute h-full bg-red-500 opacity-20"
                  style={{
                    left: `${gapStartPercentage}%`,
                    width: `${gapWidthPercentage}%`,
                  }}
                  title="Deleted content"
                />
              )
            }
            return null
          })}

        {/* Progress fill */}
        <div
          className="absolute h-full bg-primary rounded-full transition-all duration-150"
          style={{
            width: `${progressPercentage}%`,
            background: isDragging
              ? 'linear-gradient(90deg, #3b82f6, #1d4ed8)'
              : '#3b82f6',
          }}
        />

        {/* Current position indicator */}
        <div
          className={`absolute w-3 h-3 bg-white border-2 border-primary rounded-full -top-1 -ml-1.5 shadow-md transition-all duration-150 ${
            isDragging ? 'scale-125 shadow-lg' : 'hover:scale-110'
          }`}
          style={{
            left: `${progressPercentage}%`,
          }}
        />

        {/* Hover time indicator */}
        {hoverTime !== null && !isDragging && (
          <div
            className="absolute w-1 bg-white opacity-60 -top-1"
            style={{
              left: `${(hoverTime / duration) * 100}%`,
              height: `${height + 8}px`,
            }}
          />
        )}
      </div>

      {/* Hover tooltip */}
      {hoverTime !== null && !isDragging && (
        <div
          className="absolute -top-8 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-10"
          style={{
            left: `${(hoverTime / duration) * 100}%`,
          }}
        >
          {formatTime(hoverTime)}
          {hoverSegment && (
            <div className="text-gray-300">Segment: {hoverSegment.type}</div>
          )}
        </div>
      )}

      {/* Current segment info */}
      {currentSegment && (
        <div className="mt-1 text-xs text-gray-400">
          Current: {currentSegment.type} segment (
          {formatTime(currentSegment.virtualStartTime)} -{' '}
          {formatTime(currentSegment.virtualEndTime)})
        </div>
      )}
    </div>
  )
}

export default VirtualTimelineProgressBar
