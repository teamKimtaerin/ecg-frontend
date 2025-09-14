import React, { useState, useCallback } from 'react'
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
}

// 시간 문자열을 초로 변환
function timeToSeconds(timeStr: string): number {
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

export default function ClipTimeline({ index, clipId, timeline, onTimelineEdit }: ClipTimelineProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(timeline)
  
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

  // 타임라인 문자열 파싱 (예: "0:12.5 → 0:18.7")
  const timeRange = timeline.split(' → ')
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

  return (
    <div className="flex flex-col items-center pt-1 px-1">
      <span className="text-xs text-gray-600 font-mono font-bold mb-1">
        #{index}
      </span>
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
        {((timeToSeconds(endTime) - timeToSeconds(startTime))).toFixed(1)}초
      </div>
    </div>
  )
}
