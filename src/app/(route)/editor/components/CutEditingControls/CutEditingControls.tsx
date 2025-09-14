'use client'

import React, { useCallback } from 'react'
import { useEditorStore } from '../../store'
import Button from '@/components/ui/Button'
// 기존 프로젝트의 아이콘 시스템 사용
import { 
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  TrashIcon,
} from '@/components/icons'
import { playbackEngine } from '@/utils/timeline/playbackEngine'

interface CutEditingControlsProps {
  className?: string
}

const CutEditingControls: React.FC<CutEditingControlsProps> = ({
  className = '',
}) => {
  const {
    timeline,
    selectedClipIds,
    isPlaying,
    editMode,
    clips: originalClips,
    play,
    pause,
    stop,
    seekTo,
    splitTimelineClip,
    removeTimelineClip,
    duplicateTimelineClip,
    setEditMode,
  } = useEditorStore()

  const { playbackPosition, totalDuration } = timeline
  const hasSelectedClips = selectedClipIds.size > 0

  // 재생/일시정지 토글
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause()
      playbackEngine.pause()
    } else {
      play()
      playbackEngine.play()
    }
  }, [isPlaying, play, pause])

  // 정지
  const handleStop = useCallback(() => {
    stop()
    playbackEngine.stop()
  }, [stop])

  // 이전 클립으로 이동
  const handlePreviousClip = useCallback(() => {
    const moved = playbackEngine.previousClip()
    if (moved) {
      const newTime = playbackEngine.getPlaybackState().currentTime
      seekTo(newTime)
    }
  }, [seekTo])

  // 다음 클립으로 이동
  const handleNextClip = useCallback(() => {
    const moved = playbackEngine.nextClip()
    if (moved) {
      const newTime = playbackEngine.getPlaybackState().currentTime
      seekTo(newTime)
    }
  }, [seekTo])

  // 클립 분할
  const handleSplitClip = useCallback(() => {
    if (!hasSelectedClips) return
    
    const selectedClipId = Array.from(selectedClipIds)[0]
    const splitTime = playbackPosition
    
    const newClipIds = splitTimelineClip(selectedClipId, splitTime)
    if (newClipIds.length === 0) {
      // 분할할 수 없는 경우 (재생 헤드가 클립 범위 밖)
      alert('현재 위치에서 클립을 분할할 수 없습니다.')
    }
  }, [hasSelectedClips, selectedClipIds, playbackPosition, splitTimelineClip])

  // 선택된 클립 삭제
  const handleDeleteSelectedClips = useCallback(() => {
    if (!hasSelectedClips) return
    
    const confirmed = confirm(`선택된 ${selectedClipIds.size}개의 클립을 삭제하시겠습니까?`)
    if (confirmed) {
      selectedClipIds.forEach(clipId => {
        removeTimelineClip(clipId)
      })
    }
  }, [hasSelectedClips, selectedClipIds, removeTimelineClip])

  // 선택된 클립 복제
  const handleDuplicateSelectedClips = useCallback(() => {
    if (!hasSelectedClips) return
    
    selectedClipIds.forEach(clipId => {
      duplicateTimelineClip(clipId)
    })
  }, [hasSelectedClips, selectedClipIds, duplicateTimelineClip])

  // 클립 복사 (임시 - 실제로는 클립보드에 저장)
  const handleCopyClips = useCallback(() => {
    if (!hasSelectedClips) return
    
    // TODO: 실제 클립보드 구현
    console.log('Copy clips:', Array.from(selectedClipIds))
  }, [hasSelectedClips, selectedClipIds])

  // 클립 붙여넣기 (임시 - 실제로는 클립보드에서 가져옴)
  const handlePasteClips = useCallback(() => {
    // TODO: 실제 클립보드 구현
    console.log('Paste clips at time:', playbackPosition)
  }, [playbackPosition])

  // 편집 모드 변경
  const handleEditModeChange = useCallback((mode: 'ripple' | 'insert' | 'overwrite') => {
    setEditMode(mode)
  }, [setEditMode])

  return (
    <div className={`cut-editing-controls bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* 재생 컨트롤 */}
      <div className="flex items-center space-x-2 mb-4">
        <h3 className="text-sm font-medium text-gray-700 mr-4">재생 제어</h3>
        
        <Button
          variant="secondary"
          size="small"
          onClick={handlePreviousClip}
          isDisabled={playbackPosition <= 0}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Button>
        
        <Button
          variant="accent"
          size="small"
          onClick={handlePlayPause}
        >
          {isPlaying ? (
            <PauseIcon className="w-4 h-4" />
          ) : (
            <PlayIcon className="w-4 h-4" />
          )}
        </Button>
        
        <Button
          variant="secondary"
          size="small"
          onClick={handleStop}
          isDisabled={playbackPosition <= 0 && !isPlaying}
        >
          <div className="w-4 h-4 bg-current" />
        </Button>
        
        <Button
          variant="secondary"
          size="small"
          onClick={handleNextClip}
          isDisabled={playbackPosition >= totalDuration}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
        
        {/* 시간 표시 */}
        <div className="ml-4 text-sm text-gray-600 font-mono">
          {Math.floor(playbackPosition / 60)}:{(playbackPosition % 60).toFixed(1).padStart(4, '0')} 
          {' / '}
          {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toFixed(1).padStart(4, '0')}
        </div>
      </div>

      {/* 편집 컨트롤 */}
      <div className="flex items-center space-x-2 mb-4">
        <h3 className="text-sm font-medium text-gray-700 mr-4">편집 도구</h3>
        
        <Button
          variant="secondary"
          size="small"
          onClick={handleSplitClip}
          isDisabled={!hasSelectedClips}
        >
          <div className="w-4 h-4 text-current">✂️</div>
          <span className="ml-1">분할</span>
        </Button>
        
        <Button
          variant="secondary"
          size="small"
          onClick={handleCopyClips}
          isDisabled={!hasSelectedClips}
        >
          <CopyIcon className="w-4 h-4" />
          <span className="ml-1">복사</span>
        </Button>
        
        <Button
          variant="secondary"
          size="small"
          onClick={handlePasteClips}
        >
          <div className="w-4 h-4 text-current">📋</div>
          <span className="ml-1">붙여넣기</span>
        </Button>
        
        <Button
          variant="secondary"
          size="small"
          onClick={handleDuplicateSelectedClips}
          isDisabled={!hasSelectedClips}
        >
          <div className="w-4 h-4 text-current">📄</div>
          <span className="ml-1">복제</span>
        </Button>
        
        <Button
          variant="negative"
          size="small"
          onClick={handleDeleteSelectedClips}
          isDisabled={!hasSelectedClips}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <TrashIcon className="w-4 h-4" />
          <span className="ml-1">삭제</span>
        </Button>
      </div>

      {/* 편집 모드 선택 */}
      <div className="flex items-center space-x-2">
        <h3 className="text-sm font-medium text-gray-700 mr-4">편집 모드</h3>
        
        <div className="flex space-x-1 bg-gray-100 rounded p-1">
          <button
            className={`px-3 py-1 text-xs rounded transition-colors ${
              editMode === 'ripple' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => handleEditModeChange('ripple')}
            title="리플 편집 - 클립 이동 시 후속 클립들도 함께 이동"
          >
            리플
          </button>
          <button
            className={`px-3 py-1 text-xs rounded transition-colors ${
              editMode === 'insert' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => handleEditModeChange('insert')}
            title="삽입 편집 - 클립 삽입 시 후속 클립들을 밀어냄"
          >
            삽입
          </button>
          <button
            className={`px-3 py-1 text-xs rounded transition-colors ${
              editMode === 'overwrite' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => handleEditModeChange('overwrite')}
            title="덮어쓰기 편집 - 클립 배치 시 겹치는 부분을 덮어씀"
          >
            덮어쓰기
          </button>
        </div>
      </div>

      {/* 선택된 클립 정보 */}
      {hasSelectedClips && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            선택된 클립: {selectedClipIds.size}개
          </div>
        </div>
      )}
    </div>
  )
}

export default CutEditingControls