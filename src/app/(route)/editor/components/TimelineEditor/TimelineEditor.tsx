'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../store'
import TimelineTrack from './TimelineTrack'
import PlaybackHead from './PlaybackHead'
import TimelineRuler from './TimelineRuler'
import { TrackType } from '../../store/slices/timelineSlice'

interface TimelineEditorProps {
  height?: number
  className?: string
  onTimelineClick?: (time: number) => void
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({
  height = 400,
  className = '',
  onTimelineClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartScrollLeft, setDragStartScrollLeft] = useState(0)

  // Store hooks - 타임라인 관련 상태들
  const {
    timeline,
    selectedClipIds: timelineSelectedClipIds,
    draggedClipId,
    editMode,
    trackHeight,
    updateTimeline,
    selectTimelineClip,
    clearTimelineSelection,
    setPlaybackPosition,
    zoomTimeline,
    enableSequentialMode,
    disableSequentialMode,
  } = useEditorStore()

  const { clips, playbackPosition, viewportStart, viewportEnd, zoom, snapToGrid, gridSize, isSequentialMode } = timeline

  // 트랙별로 클립 그룹화
  const trackGroups = React.useMemo(() => {
    const groups: Record<string, typeof clips> = {}
    
    clips.forEach(clip => {
      const trackKey = `${clip.track}_${clip.trackIndex}`
      if (!groups[trackKey]) {
        groups[trackKey] = []
      }
      groups[trackKey].push(clip)
    })

    return groups
  }, [clips])

  // 시간을 픽셀 좌표로 변환
  const timeToPixel = useCallback((time: number): number => {
    return (time - viewportStart) * zoom
  }, [viewportStart, zoom])

  // 픽셀 좌표를 시간으로 변환
  const pixelToTime = useCallback((pixel: number): number => {
    return viewportStart + (pixel / zoom)
  }, [viewportStart, zoom])

  // 그리드에 스냅
  const snapToGridTime = useCallback((time: number): number => {
    if (!snapToGrid) return time
    return Math.round(time / gridSize) * gridSize
  }, [snapToGrid, gridSize])

  // 타임라인 클릭 핸들러
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return
    
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const clickX = e.clientX - rect.left
    const clickTime = pixelToTime(clickX)
    const snappedTime = snapToGridTime(clickTime)

    // 재생 헤드 위치 업데이트
    setPlaybackPosition(snappedTime)
    
    // 외부 콜백 호출
    onTimelineClick?.(snappedTime)

    // 클립 선택 해제 (빈 공간 클릭 시)
    if (!e.shiftKey) {
      clearTimelineSelection()
    }
  }, [
    isDragging,
    pixelToTime,
    snapToGridTime,
    setPlaybackPosition,
    onTimelineClick,
    clearTimelineSelection,
  ])

  // 마우스 휠로 줌 조정
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(1, Math.min(100, zoom * zoomFactor))
      
      zoomTimeline(newZoom)
    } else {
      // 수평 스크롤
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft += e.deltaX
      }
    }
  }, [zoom, zoomTimeline])

  // 드래그 스크롤 시작
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return // 왼쪽 클릭만
    
    setIsDragging(true)
    setDragStartX(e.clientX)
    setDragStartScrollLeft(scrollContainerRef.current?.scrollLeft || 0)
    
    document.body.style.cursor = 'grabbing'
  }, [])

  // 드래그 스크롤 진행
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    
    const deltaX = dragStartX - e.clientX
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = dragStartScrollLeft + deltaX
    }
  }, [isDragging, dragStartX, dragStartScrollLeft])

  // 드래그 스크롤 종료
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    document.body.style.cursor = 'default'
  }, [])

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

  // 뷰포트 너비 계산
  const viewportWidth = (viewportEnd - viewportStart) * zoom

  // 트랙 목록 정의
  const trackList: Array<{ type: TrackType; index: number; label: string }> = [
    { type: 'subtitle', index: 0, label: '자막' },
    { type: 'video', index: 0, label: '비디오' },
    { type: 'audio', index: 0, label: '오디오' },
  ]

  return (
    <div className={`timeline-editor bg-gray-100 border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* 헤더 - 줌, 편집 모드 등 컨트롤 */}
      <div className="timeline-header bg-white border-b border-gray-200 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">편집 모드: {editMode}</span>
          
          {/* 연속 재생 모드 토글 */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isSequentialMode}
              onChange={() => isSequentialMode ? disableSequentialMode() : enableSequentialMode()}
              id="sequential-mode"
              className="rounded"
            />
            <label htmlFor="sequential-mode" className="text-xs text-gray-600">
              연속 재생 모드
            </label>
            {isSequentialMode && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                순서대로 재생
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-xs text-gray-600">줌:</label>
            <input
              type="range"
              min="1"
              max="100"
              value={zoom}
              onChange={(e) => zoomTimeline(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-xs text-gray-600">{zoom.toFixed(1)}x</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={() => updateTimeline({ snapToGrid: !snapToGrid })}
              id="snap-to-grid"
              className="rounded"
            />
            <label htmlFor="snap-to-grid" className="text-xs text-gray-600">
              그리드 스냅
            </label>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {Math.floor(playbackPosition / 60)}:{(playbackPosition % 60).toFixed(1).padStart(4, '0')}
        </div>
      </div>

      {/* 타임라인 컨텐츠 */}
      <div className="timeline-content" style={{ height: `${height}px` }}>
        <div className="flex h-full">
          {/* 트랙 라벨 */}
          <div className="track-labels bg-gray-50 border-r border-gray-200 w-20 flex-shrink-0">
            <div className="h-8 border-b border-gray-200" /> {/* 룰러 공간 */}
            {trackList.map(({ type, index, label }) => (
              <div
                key={`${type}_${index}`}
                className="track-label flex items-center justify-center border-b border-gray-200 text-xs font-medium text-gray-600"
                style={{ height: `${trackHeight}px` }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* 스크롤 가능한 타임라인 영역 */}
          <div 
            ref={scrollContainerRef}
            className="timeline-scroll-container flex-1 overflow-x-auto overflow-y-hidden"
            onWheel={handleWheel}
          >
            <div 
              ref={containerRef}
              className="timeline-canvas relative cursor-grab"
              style={{ width: `${viewportWidth}px` }}
              onClick={handleTimelineClick}
              onMouseDown={handleMouseDown}
            >
              {/* 시간 룰러 */}
              <TimelineRuler
                startTime={viewportStart}
                endTime={viewportEnd}
                zoom={zoom}
                gridSize={gridSize}
                height={32}
              />

              {/* 트랙들 */}
              <div className="tracks-container">
                {trackList.map(({ type, index }) => {
                  const trackKey = `${type}_${index}`
                  const trackClips = trackGroups[trackKey] || []
                  
                  return (
                    <TimelineTrack
                      key={trackKey}
                      trackType={type}
                      trackIndex={index}
                      clips={trackClips}
                      height={trackHeight}
                      zoom={zoom}
                      viewportStart={viewportStart}
                      onClipSelect={(clipId, multiSelect) => selectTimelineClip(clipId, multiSelect)}
                      selectedClipIds={timelineSelectedClipIds}
                      draggedClipId={draggedClipId}
                    />
                  )
                })}
              </div>

              {/* 재생 헤드 */}
              <PlaybackHead
                position={playbackPosition}
                zoom={zoom}
                viewportStart={viewportStart}
                height={height - 32} // 룰러 높이 제외
              />

              {/* 그리드 라인 */}
              {snapToGrid && (
                <div className="grid-lines absolute inset-0 pointer-events-none">
                  {Array.from({ length: Math.floor((viewportEnd - viewportStart) / gridSize) + 1 }, (_, i) => {
                    const time = viewportStart + (i * gridSize)
                    const x = timeToPixel(time)
                    
                    return (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 w-px bg-gray-300 opacity-30"
                        style={{ left: `${x}px` }}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 정보 바 */}
      <div className="timeline-footer bg-white border-t border-gray-200 p-1 flex items-center justify-between text-xs text-gray-500">
        <div>
          총 {clips.length}개 클립 | 선택된 클립: {timelineSelectedClipIds.size}개
        </div>
        <div>
          총 길이: {Math.floor(timeline.totalDuration / 60)}:{(timeline.totalDuration % 60).toFixed(1).padStart(4, '0')}
        </div>
      </div>
    </div>
  )
}

export default TimelineEditor