import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useEditorStore } from '../../store'

// Global window interface extension for video player
declare global {
  interface Window {
    videoPlayer?: {
      play: () => void
      pause: () => void
      seekTo: (time: number) => void
      getCurrentTime: () => number
      playSegment: (start: number, end: number) => void
    }
  }
}

interface ClipTimelineProps {
  index: number
  clipId: string
  timeline: string
  onTimelineEdit?: (clipId: string, newTimeline: string) => void
  onClipTimingUpdate?: (clipId: string, newStartTime: number, newEndTime: number) => void
}

// 시간 문자열을 초로 변환
function timeToSeconds(timeStr: string | undefined): number {
  if (!timeStr || typeof timeStr !== 'string') {
    return 0
  }
  const parts = timeStr.split(':')
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10) || 0
    const seconds = parseFloat(parts[1]) || 0
    return minutes * 60 + seconds
  }
  return 0
}

// 초를 시간 문자열로 변환
function secondsToTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toFixed(1).padStart(4, '0')}`
}

export default function ClipTimeline({ index, clipId, timeline, onTimelineEdit, onClipTimingUpdate }: ClipTimelineProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(timeline)
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartTime, setDragStartTime] = useState(0)
  const timelineBarRef = useRef<HTMLDivElement>(null)
  
  // 비디오 플레이어 seek 기능을 위한 store hook
  const seekTo = useCallback((time: number) => {
    // 비디오 플레이어로 시크
    if (window.videoPlayer) {
      window.videoPlayer.seekTo(time)
    }
  }, [])

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true)
    setEditValue(timeline)
  }, [timeline])

  const handleTimeClick = useCallback((timeStr: string) => {
    const seconds = timeToSeconds(timeStr)
    seekTo(seconds)
  }, [seekTo])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false)
      if (onTimelineEdit && editValue !== timeline) {
        onTimelineEdit(clipId, editValue)
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditValue(timeline)
    }
  }, [clipId, editValue, timeline, onTimelineEdit])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
    if (onTimelineEdit && editValue !== timeline) {
      onTimelineEdit(clipId, editValue)
    }
  }, [clipId, editValue, timeline, onTimelineEdit])

  // 드래그 핸들링 로직
  const handleMouseDown = useCallback((e: React.MouseEvent, handle: 'start' | 'end') => {
    e.preventDefault()
    e.stopPropagation()
    
    // 안전한 timeline 파싱
    if (!timeline || typeof timeline !== 'string' || !timeline.includes(' → ')) {
      return
    }
    
    setIsDragging(handle)
    setDragStartX(e.clientX)
    const timeRange = timeline.split(' → ')
    setDragStartTime(timeToSeconds(handle === 'start' ? timeRange[0] : timeRange[1]))
  }, [timeline])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !timelineBarRef.current) return
    
    const deltaX = e.clientX - dragStartX
    const barWidth = timelineBarRef.current.offsetWidth - 24 // 핸들 크기 고려
    const deltaTime = (deltaX / barWidth) * 10 // 10초 범위로 가정
    const newTime = Math.max(0, dragStartTime + deltaTime)
    
    // 안전한 timeline 파싱
    if (!timeline || typeof timeline !== 'string' || !timeline.includes(' → ')) {
      return
    }
    
    // 임시로 UI 업데이트 (실제 적용은 mouseup에서)
    const timeRange = timeline.split(' → ')
    const startTime = timeToSeconds(timeRange[0])
    const endTime = timeToSeconds(timeRange[1])
    
    if (isDragging === 'start') {
      const newStartTime = Math.min(newTime, endTime - 0.1) // 최소 0.1초 간격
      // UI에서 임시 표시할 수도 있음
    } else {
      const newEndTime = Math.max(newTime, startTime + 0.1) // 최소 0.1초 간격
      // UI에서 임시 표시할 수도 있음
    }
  }, [isDragging, dragStartX, dragStartTime, timeline])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    
    // 안전한 timeline 파싱
    if (!timeline || typeof timeline !== 'string' || !timeline.includes(' → ')) {
      setIsDragging(null)
      return
    }
    
    const deltaX = e.clientX - dragStartX
    const barWidth = timelineBarRef.current?.offsetWidth || 100
    const deltaTime = (deltaX / (barWidth - 24)) * 10 // 10초 범위
    const newTime = Math.max(0, dragStartTime + deltaTime)
    
    const timeRange = timeline.split(' → ')
    const startTime = timeToSeconds(timeRange[0])
    const endTime = timeToSeconds(timeRange[1])
    
    let newStartTime = startTime
    let newEndTime = endTime
    
    if (isDragging === 'start') {
      newStartTime = Math.min(newTime, endTime - 0.1)
    } else {
      newEndTime = Math.max(newTime, startTime + 0.1)
    }
    
    // 업데이트된 시간으로 콜백 호출
    if (onClipTimingUpdate) {
      onClipTimingUpdate(clipId, newStartTime, newEndTime)
    }
    
    setIsDragging(null)
  }, [isDragging, dragStartX, dragStartTime, timeline, clipId, onClipTimingUpdate])

  // 마우스 이벤트 리스너 등록/해제
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // 타임라인 문자열 파싱 (예: "0:12.5 → 0:18.7")
  const timeRange = timeline && typeof timeline === 'string' && timeline.includes(' → ') 
    ? timeline.split(' → ') 
    : ['0:00.0', '0:00.0']
  const startTime = timeRange[0] || '0:00.0'
  const endTime = timeRange[1] || '0:00.0'

  if (isEditing) {
    return (
      <div className="flex flex-col items-center pt-1 px-1">
        <span className="text-xs text-gray-600 font-mono font-bold mb-1">
          #{index}
        </span>
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyPress={handleKeyPress}
          onBlur={handleBlur}
          className="text-xs font-mono bg-white border border-blue-500 rounded px-1 py-0.5 w-20 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="0:00.0 → 0:00.0"
          autoFocus
        />
      </div>
    )
  }

  // 타임라인 바 렌더링
  const startSeconds = timeToSeconds(startTime)
  const endSeconds = timeToSeconds(endTime)
  const duration = endSeconds - startSeconds

  return (
    <div className="flex flex-col items-center pt-1 px-1">
      <span className="text-xs text-gray-600 font-mono font-bold mb-1">
        #{index}
      </span>
      
      {/* 시각적 타임라인 바 */}
      <div className="relative w-24 h-6 mb-2">
        <div 
          ref={timelineBarRef}
          className="w-full h-2 bg-gray-200 rounded-full relative mt-2"
        >
          {/* 타임라인 진행 바 */}
          <div className="h-full bg-blue-400 rounded-full" style={{ width: '100%' }} />
          
          {/* 시작 핸들 */}
          <div
            className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 rounded-full cursor-ew-resize hover:bg-blue-700 transition-colors ${
              isDragging === 'start' ? 'bg-blue-800 scale-110' : ''
            }`}
            style={{ left: '0%' }}
            onMouseDown={(e) => handleMouseDown(e, 'start')}
            title="시작 시간 조정"
          />
          
          {/* 종료 핸들 */}
          <div
            className={`absolute top-1/2 transform -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-blue-600 rounded-full cursor-ew-resize hover:bg-blue-700 transition-colors ${
              isDragging === 'end' ? 'bg-blue-800 scale-110' : ''
            }`}
            style={{ right: '0%' }}
            onMouseDown={(e) => handleMouseDown(e, 'end')}
            title="종료 시간 조정"
          />
        </div>
      </div>

      <div className="text-xs font-mono text-gray-700 text-center" onDoubleClick={handleDoubleClick}>
        <div 
          className="cursor-pointer hover:bg-blue-100 px-1 rounded transition-colors"
          onClick={() => handleTimeClick(startTime)}
          title="클릭하여 시작 시간으로 이동"
        >
          {startTime}
        </div>
        <div className="text-gray-400 py-0.5">→</div>
        <div 
          className="cursor-pointer hover:bg-blue-100 px-1 rounded transition-colors"
          onClick={() => handleTimeClick(endTime)}
          title="클릭하여 종료 시간으로 이동"
        >
          {endTime}
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mt-1 text-center">
        {duration.toFixed(1)}초
      </div>
    </div>
  )
}
