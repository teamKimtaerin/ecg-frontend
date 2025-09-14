'use client'

import React, { useCallback, useRef, useState, useEffect } from 'react'
import { TimelineClip } from '../../store/slices/timelineSlice'
import { useEditorStore } from '../../store'
import { clipMapper } from '@/utils/timeline/clipMapper'

interface TimelineClipComponentProps {
  clip: TimelineClip
  x: number
  width: number
  height: number
  isSelected: boolean
  isDragged: boolean
  zoom: number
  onSelect: (clipId: string, e?: React.MouseEvent) => void
  className?: string
}

const TimelineClipComponent: React.FC<TimelineClipComponentProps> = ({
  clip,
  x,
  width,
  height,
  isSelected,
  isDragged,
  zoom,
  onSelect,
  className = '',
}) => {
  const clipRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartTime, setDragStartTime] = useState(0)

  const {
    moveTimelineClip,
    trimTimelineClip,
    startDragTimelineClip,
    endDragTimelineClip,
    reorderClips,
    editMode,
    timeline,
  } = useEditorStore()

  // 클립 타입별 색상 설정
  const getClipColor = useCallback(() => {
    const baseColor = {
      video: 'bg-blue-500',
      audio: 'bg-green-500',
      subtitle: 'bg-purple-500',
    }[clip.track] || 'bg-gray-500'

    if (isDragged) return `${baseColor} opacity-60`
    if (isSelected) return `${baseColor} ring-2 ring-blue-400`
    return `${baseColor} opacity-80 hover:opacity-100`
  }, [clip.track, isDragged, isSelected])

  // 클립 텍스트 가져오기 (자막 클립의 경우)
  const getClipText = useCallback(() => {
    if (clip.track !== 'subtitle') {
      return `${clip.track} ${clip.duration.toFixed(1)}s`
    }

    // 클립 매퍼에서 텍스트 가져오기
    try {
      const mapping = clipMapper.getMapping(clip.id)
      if (mapping) {
        const text = clipMapper.getClipDisplayText(clip.id)
        return text || clip.sourceClipId
      }
    } catch (error) {
      console.warn('Failed to get clip text:', error)
    }

    return clip.sourceClipId
  }, [clip.track, clip.duration, clip.id, clip.sourceClipId])

  // 픽셀을 시간으로 변환
  const pixelToTime = useCallback((pixel: number): number => {
    return timeline.viewportStart + (pixel / zoom)
  }, [timeline.viewportStart, zoom])

  // 클릭 핸들러
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(clip.id, e)
  }, [clip.id, onSelect])

  // 마우스 다운 핸들러 (드래그 시작)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (e.button !== 0) return // 왼쪽 클릭만

    const rect = clipRef.current?.getBoundingClientRect()
    if (!rect) return

    const clickX = e.clientX - rect.left
    const resizeThreshold = 8 // 8px 내에서 리사이즈 핸들

    // 리사이즈 영역 체크
    if (clickX <= resizeThreshold) {
      setIsResizing('left')
    } else if (clickX >= width - resizeThreshold) {
      setIsResizing('right')
    } else {
      setIsDragging(true)
      startDragTimelineClip(clip.id)
    }

    setDragStartX(e.clientX)
    setDragStartTime(clip.startTime)

    // 클립 선택
    if (!isSelected) {
      onSelect(clip.id, e)
    }
  }, [
    clip.id,
    clip.startTime,
    isSelected,
    onSelect,
    startDragTimelineClip,
    width,
  ])

  // 마우스 이동 핸들러 (연속 재생 모드 지원)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging && !isResizing) return

    const deltaX = e.clientX - dragStartX
    const deltaTime = deltaX / zoom

    if (isDragging) {
      if (timeline.isSequentialMode) {
        // 연속 재생 모드: 클립 순서 재배열 로직
        const threshold = 50 // 50px 이상 이동 시 재배열
        
        if (Math.abs(deltaX) > threshold) {
          const currentOrder = [...timeline.clipOrder]
          const currentIndex = currentOrder.indexOf(clip.id)
          
          if (currentIndex !== -1) {
            let newIndex = currentIndex
            
            // 오른쪽으로 이동 (다음 클립과 자리 바꿈)
            if (deltaX > threshold && currentIndex < currentOrder.length - 1) {
              newIndex = currentIndex + 1
            }
            // 왼쪽으로 이동 (이전 클립과 자리 바꿈)
            else if (deltaX < -threshold && currentIndex > 0) {
              newIndex = currentIndex - 1
            }
            
            // 순서 변경이 필요한 경우
            if (newIndex !== currentIndex) {
              const newOrder = [...currentOrder]
              const [draggedClip] = newOrder.splice(currentIndex, 1)
              newOrder.splice(newIndex, 0, draggedClip)
              
              // 순서 재배열 적용
              reorderClips(newOrder)
              
              // 드래그 시작점 리셋 (연속적인 재배열 방지)
              setDragStartX(e.clientX)
            }
          }
        }
      } else {
        // 일반 타임라인 모드: 기존 이동 로직
        const newStartTime = Math.max(0, dragStartTime + deltaTime)
        
        // 그리드 스냅
        let snappedTime = newStartTime
        if (timeline.snapToGrid) {
          snappedTime = Math.round(newStartTime / timeline.gridSize) * timeline.gridSize
        }

        moveTimelineClip(clip.id, snappedTime)
      }
    } else if (isResizing === 'left') {
      // 왼쪽 리사이즈 (In Point 조정)
      const newInPoint = Math.max(0, clip.inPoint + deltaTime)
      const maxInPoint = clip.outPoint - 0.1 // 최소 0.1초는 유지
      
      if (newInPoint < maxInPoint) {
        trimTimelineClip(clip.id, newInPoint)
      }
    } else if (isResizing === 'right') {
      // 오른쪽 리사이즈 (Out Point 조정)
      const newOutPoint = Math.max(clip.inPoint + 0.1, clip.outPoint + deltaTime)
      trimTimelineClip(clip.id, undefined, newOutPoint)
    }
  }, [
    isDragging,
    isResizing,
    dragStartX,
    dragStartTime,
    zoom,
    timeline.snapToGrid,
    timeline.gridSize,
    timeline.isSequentialMode,
    timeline.clipOrder,
    clip.id,
    clip.inPoint,
    clip.outPoint,
    moveTimelineClip,
    trimTimelineClip,
    reorderClips,
  ])

  // 마우스 업 핸들러
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(null)
    endDragTimelineClip()
  }, [endDragTimelineClip])

  // 드래그 이벤트 리스너 등록/해제
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  // 커서 스타일 설정
  const getCursorStyle = useCallback(() => {
    if (isResizing === 'left' || isResizing === 'right') {
      return 'cursor-ew-resize'
    }
    if (isDragging) {
      return 'cursor-grabbing'
    }
    return 'cursor-grab hover:cursor-grab'
  }, [isDragging, isResizing])

  // 최소 표시 너비 (너무 작으면 텍스트 숨김)
  const showText = width > 40

  return (
    <div
      ref={clipRef}
      className={`
        timeline-clip absolute top-1 rounded border border-white/20 
        select-none transition-all duration-75 shadow-sm
        ${getClipColor()} ${getCursorStyle()} ${className}
      `}
      style={{
        left: `${x}px`,
        width: `${Math.max(10, width)}px`, // 최소 10px 너비
        height: `${height}px`,
        zIndex: isSelected ? 10 : 1,
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {/* 클립 콘텐츠 */}
      <div className="relative w-full h-full flex items-center px-2 overflow-hidden">
        {/* 클립 텍스트 */}
        {showText && (
          <div className="text-white text-xs font-medium truncate flex-1">
            {getClipText()}
          </div>
        )}
        
        {/* 지속 시간 표시 */}
        {showText && width > 80 && (
          <div className="text-white text-xs opacity-75 ml-2">
            {clip.duration.toFixed(1)}s
          </div>
        )}
      </div>

      {/* 리사이즈 핸들 */}
      {isSelected && (
        <>
          {/* 왼쪽 핸들 */}
          <div
            className="absolute left-0 top-0 bottom-0 w-2 bg-white/20 opacity-0 hover:opacity-100 cursor-ew-resize"
            onMouseDown={(e) => {
              e.stopPropagation()
              setIsResizing('left')
              setDragStartX(e.clientX)
              setDragStartTime(clip.startTime)
            }}
          />
          
          {/* 오른쪽 핸들 */}
          <div
            className="absolute right-0 top-0 bottom-0 w-2 bg-white/20 opacity-0 hover:opacity-100 cursor-ew-resize"
            onMouseDown={(e) => {
              e.stopPropagation()
              setIsResizing('right')
              setDragStartX(e.clientX)
              setDragStartTime(clip.startTime)
            }}
          />
        </>
      )}

      {/* 클립 상태 표시 */}
      <div className="absolute top-1 right-1 flex space-x-1">
        {/* 효과 있음 표시 */}
        {clip.effects && clip.effects.length > 0 && (
          <div className="w-2 h-2 bg-yellow-400 rounded-full" />
        )}
        
        {/* 트랜지션 있음 표시 */}
        {clip.transitions && clip.transitions.length > 0 && (
          <div className="w-2 h-2 bg-orange-400 rounded-full" />
        )}
        
        {/* 비활성화 표시 */}
        {!clip.enabled && (
          <div className="w-2 h-2 bg-red-400 rounded-full" />
        )}
      </div>

      {/* 선택 표시 */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-400 rounded pointer-events-none" />
      )}
    </div>
  )
}

export default TimelineClipComponent