'use client'

import React, { useCallback, useState } from 'react'
import { VirtualSegment } from '@/utils/virtual-timeline/types'
import Tooltip from '@/components/ui/Tooltip'

interface VirtualSegmentVisualizationProps {
  segments: VirtualSegment[]
  currentTime: number
  duration: number
  onSeek: (virtualTime: number) => void
  className?: string
  height?: number
  showTooltips?: boolean
  showDeletedSegments?: boolean
}

export const VirtualSegmentVisualization: React.FC<
  VirtualSegmentVisualizationProps
> = ({
  segments,
  currentTime,
  duration,
  onSeek,
  className = '',
  height = 40,
  showTooltips = true,
  showDeletedSegments = true,
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)

  // Separate active and deleted segments
  const activeSegments = segments.filter((segment) => segment.isEnabled)
  const deletedSegments = showDeletedSegments
    ? segments.filter((segment) => !segment.isEnabled)
    : []

  // Calculate segment visual properties
  const getSegmentProps = useCallback(
    (segment: VirtualSegment, _isDeleted = false) => {
      if (duration === 0) return { left: 0, width: 0, percentage: 0 }

      const startPercentage = (segment.virtualStartTime / duration) * 100
      const widthPercentage =
        ((segment.virtualEndTime - segment.virtualStartTime) / duration) * 100

      return {
        left: startPercentage,
        width: widthPercentage,
        percentage: widthPercentage,
      }
    },
    [duration]
  )

  // Get segment styling based on type and state
  const getSegmentStyling = useCallback(
    (segment: VirtualSegment, isDeleted = false, isHovered = false) => {
      const baseClasses =
        'absolute h-full rounded-sm transition-all duration-200 cursor-pointer border'

      if (isDeleted) {
        return {
          className: `${baseClasses} bg-red-200 border-red-400 opacity-40 hover:opacity-60`,
          style: { zIndex: 1 },
        }
      }

      const typeStyles = {
        normal: {
          bg: isHovered ? 'bg-blue-500' : 'bg-blue-400',
          border: 'border-blue-600',
          opacity: 'opacity-80 hover:opacity-100',
        },
        split: {
          bg: isHovered ? 'bg-green-500' : 'bg-green-400',
          border: 'border-green-600',
          opacity: 'opacity-80 hover:opacity-100',
        },
        moved: {
          bg: isHovered ? 'bg-purple-500' : 'bg-purple-400',
          border: 'border-purple-600',
          opacity: 'opacity-80 hover:opacity-100',
        },
      }

      const style = typeStyles[segment.type] || typeStyles.normal

      return {
        className: `${baseClasses} ${style.bg} ${style.border} ${style.opacity}`,
        style: { zIndex: isHovered ? 10 : 5 },
      }
    },
    []
  )

  // Handle segment click for seeking
  const handleSegmentClick = useCallback(
    (segment: VirtualSegment, e: React.MouseEvent) => {
      e.stopPropagation()
      // Seek to the start of the clicked segment
      onSeek(segment.virtualStartTime)
    },
    [onSeek]
  )

  // Handle timeline click for seeking
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const clickPosition = (e.clientX - rect.left) / rect.width
      const seekTime = Math.max(0, Math.min(duration, clickPosition * duration))
      onSeek(seekTime)
    },
    [duration, onSeek]
  )

  // Format time for tooltips - TODO: Use this for tooltips
  const _formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Current time indicator position
  const currentTimePercentage =
    duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`virtual-segment-visualization ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium text-gray-700">
          가상 타임라인 세그먼트
        </div>
        <div className="text-xs text-gray-500">
          활성: {activeSegments.length}, 삭제: {deletedSegments.length}
        </div>
      </div>

      {/* Timeline Track */}
      <div
        className="relative bg-gray-200 rounded border border-gray-300 cursor-pointer"
        style={{ height: `${height}px` }}
        onClick={handleTimelineClick}
      >
        {/* Deleted segments (shown first, behind active segments) */}
        {deletedSegments.map((segment) => {
          const props = getSegmentProps(segment, true)
          const styling = getSegmentStyling(
            segment,
            true,
            hoveredSegment === segment.id
          )

          return (
            <Tooltip
              key={`deleted-${segment.id}`}
              content={
                showTooltips
                  ? `Deleted Segment - Clip: ${segment.sourceClipId}`
                  : ''
              }
              disabled={!showTooltips}
            >
              <div
                className={styling.className}
                style={{
                  left: `${props.left}%`,
                  width: `${props.width}%`,
                  ...styling.style,
                }}
                onMouseEnter={() => setHoveredSegment(segment.id)}
                onMouseLeave={() => setHoveredSegment(null)}
                onClick={(e) => handleSegmentClick(segment, e)}
              >
                {/* Deleted segment strikethrough effect */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-red-600"></div>
                </div>
              </div>
            </Tooltip>
          )
        })}

        {/* Active segments */}
        {activeSegments.map((segment, index) => {
          const props = getSegmentProps(segment)
          const styling = getSegmentStyling(
            segment,
            false,
            hoveredSegment === segment.id
          )

          return (
            <Tooltip
              key={segment.id}
              content={
                showTooltips
                  ? `${segment.type} Segment - Clip: ${segment.sourceClipId}`
                  : ''
              }
              disabled={!showTooltips}
            >
              <div
                className={styling.className}
                style={{
                  left: `${props.left}%`,
                  width: `${props.width}%`,
                  ...styling.style,
                }}
                onMouseEnter={() => setHoveredSegment(segment.id)}
                onMouseLeave={() => setHoveredSegment(null)}
                onClick={(e) => handleSegmentClick(segment, e)}
              >
                {/* Segment index label */}
                {props.width > 5 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white drop-shadow">
                      {index + 1}
                    </span>
                  </div>
                )}

                {/* Segment type indicator */}
                <div className="absolute top-0 left-0 w-2 h-2 rounded-br">
                  <div
                    className={`w-full h-full ${
                      segment.type === 'split'
                        ? 'bg-green-600'
                        : segment.type === 'moved'
                          ? 'bg-purple-600'
                          : 'bg-blue-600'
                    }`}
                  ></div>
                </div>
              </div>
            </Tooltip>
          )
        })}

        {/* Current time indicator */}
        <div
          className="absolute w-0.5 bg-white shadow-md z-20"
          style={{
            left: `${currentTimePercentage}%`,
            height: `${height}px`,
            top: 0,
          }}
        >
          {/* Current time marker head */}
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-gray-400 rounded-full shadow-sm"></div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
          <span className="text-gray-600">일반</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
          <span className="text-gray-600">분할</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-purple-400 rounded-sm"></div>
          <span className="text-gray-600">이동</span>
        </div>
        {showDeletedSegments && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-200 rounded-sm relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-red-600"></div>
              </div>
            </div>
            <span className="text-gray-600">삭제됨</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default VirtualSegmentVisualization
