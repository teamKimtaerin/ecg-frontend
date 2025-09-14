'use client'

import React, { useCallback } from 'react'
import { TrackType, TimelineClip } from '../../store/slices/timelineSlice'
import TimelineClipComponent from './TimelineClipComponent'

interface TimelineTrackProps {
  trackType: TrackType
  trackIndex: number
  clips: TimelineClip[]
  height: number
  zoom: number
  viewportStart: number
  selectedClipIds: Set<string>
  draggedClipId: string | null
  onClipSelect: (clipId: string, multiSelect?: boolean) => void
  className?: string
}

const TimelineTrack: React.FC<TimelineTrackProps> = ({
  trackType,
  trackIndex,
  clips,
  height,
  zoom,
  viewportStart,
  selectedClipIds,
  draggedClipId,
  onClipSelect,
  className = '',
}) => {
  // 트랙 타입별 색상 설정
  const getTrackColor = useCallback((type: TrackType): string => {
    switch (type) {
      case 'video':
        return 'bg-blue-50 border-blue-200'
      case 'audio':
        return 'bg-green-50 border-green-200'
      case 'subtitle':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }, [])

  // 시간을 픽셀로 변환
  const timeToPixel = useCallback((time: number): number => {
    return (time - viewportStart) * zoom
  }, [viewportStart, zoom])

  // 클립 선택 핸들러
  const handleClipSelect = useCallback((clipId: string, e?: React.MouseEvent) => {
    const multiSelect = e?.shiftKey || e?.ctrlKey || e?.metaKey
    onClipSelect(clipId, multiSelect)
  }, [onClipSelect])

  // 트랙 클릭 핸들러 (빈 공간 클릭)
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    // 빈 공간 클릭 시에는 선택 해제를 부모 컴포넌트에서 처리
  }, [])

  return (
    <div
      className={`timeline-track relative border-b border-gray-200 ${getTrackColor(trackType)} ${className}`}
      style={{ height: `${height}px` }}
      onClick={handleTrackClick}
    >
      {/* 트랙 배경 */}
      <div className="absolute inset-0 bg-transparent" />

      {/* 클립들 */}
      {clips.map((clip) => {
        const startX = timeToPixel(clip.startTime)
        const width = clip.duration * zoom
        
        // 뷰포트 범위를 벗어나면 렌더링하지 않음 (성능 최적화)
        const clipEndTime = clip.startTime + clip.duration
        if (clipEndTime < viewportStart || clip.startTime > viewportStart + (1000 / zoom)) {
          return null
        }

        return (
          <TimelineClipComponent
            key={clip.id}
            clip={clip}
            x={startX}
            width={width}
            height={height - 4} // 트랙 내부 여백
            isSelected={selectedClipIds.has(clip.id)}
            isDragged={draggedClipId === clip.id}
            zoom={zoom}
            onSelect={handleClipSelect}
          />
        )
      })}

      {/* 트랙 구분선 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-300" />
    </div>
  )
}

export default TimelineTrack