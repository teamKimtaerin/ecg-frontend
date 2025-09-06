'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'

// Store
import { useEditorStore } from './store'

// Hooks
import { useDragAndDrop } from './hooks/useDragAndDrop'
import { useSelectionBox } from './hooks/useSelectionBox'
import { useUploadModal } from '@/hooks/useUploadModal'

// Components
import EditorHeaderTabs from './components/EditorHeaderTabs'
import Toolbar from '@/components/ui/Toolbar'
import VideoSection from './components/VideoSection'
import SubtitleEditList from './components/SubtitleEditList'
import DragOverlayContent from './components/DragOverlayContent'
import SelectionBox from '@/components/SelectionBox'
import UploadModal from '../components/UploadModal'
import { ClipItem } from '@/components/shared/ClipComponent'

// Utils
import { areClipsConsecutive } from '@/utils/clipMerger'
import { showToast } from '@/utils/toast'
import { EditorHistory } from '@/utils/EditorHistory'
import { MergeClipsCommand } from '@/utils/commands/MergeClipsCommand'

export default function EditorPage() {
  // Store state for DnD
  const { activeId } = useEditorStore()

  // Local state
  const [activeTab, setActiveTab] = useState('home')
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const [checkedClipIds, setCheckedClipIds] = useState<string[]>([])
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [editorHistory] = useState(() => new EditorHistory())

  // Upload modal hook
  const { isTranscriptionLoading, handleFileSelect, handleStartTranscription } =
    useUploadModal()

  // Initial clips data
  const [clips, setClips] = useState<ClipItem[]>([
    {
      id: '1',
      timeline: '1',
      speaker: 'Speaker 1',
      subtitle: '이제 웹님',
      fullText: '이제 웹님',
      duration: '1.283초',
      thumbnail: '/placeholder-thumb.jpg',
      words: [
        { id: '1-1', text: '이제', start: 15.0, end: 15.5, isEditable: true },
        { id: '1-2', text: '웹님', start: 15.5, end: 16.0, isEditable: true },
      ],
    },
    {
      id: '2',
      timeline: '2',
      speaker: 'Speaker 2',
      subtitle: '네시요',
      fullText: '네시요',
      duration: '14.683초',
      thumbnail: '/placeholder-thumb.jpg',
      words: [
        { id: '2-1', text: '네시요', start: 24.0, end: 24.8, isEditable: true },
      ],
    },
    {
      id: '3',
      timeline: '3',
      speaker: 'Speaker 1',
      subtitle: '지금다',
      fullText: '지금다',
      duration: '4.243초',
      thumbnail: '/placeholder-thumb.jpg',
      words: [
        { id: '3-1', text: '지금다', start: 32.0, end: 32.8, isEditable: true },
      ],
    },
    {
      id: '4',
      timeline: '4',
      speaker: 'Speaker 1',
      subtitle: '이 지금 이는 한 공에',
      fullText: '이 지금 이는 한 공에',
      duration: '6.163초',
      thumbnail: '/placeholder-thumb.jpg',
      words: [
        { id: '4-1', text: '이', start: 41.0, end: 41.2, isEditable: true },
        { id: '4-2', text: '지금', start: 41.2, end: 41.6, isEditable: true },
        { id: '4-3', text: '이는', start: 41.6, end: 41.9, isEditable: true },
        { id: '4-4', text: '한', start: 41.9, end: 42.1, isEditable: true },
        { id: '4-5', text: '공에', start: 42.1, end: 42.5, isEditable: true },
      ],
    },
  ])

  // DnD functionality
  const { sensors, handleDragStart, handleDragEnd, handleDragCancel } =
    useDragAndDrop()

  // Selection box functionality
  const {
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isSelecting,
    selectionBox,
  } = useSelectionBox()

  // Edit handlers
  const handleWordEdit = (clipId: string, wordId: string, newText: string) => {
    setClips((prevClips) =>
      prevClips.map((clip) =>
        clip.id === clipId
          ? {
              ...clip,
              words: clip.words.map((word) =>
                word.id === wordId ? { ...word, text: newText } : word
              ),
              fullText: clip.words
                .map((word) => (word.id === wordId ? newText : word.text))
                .join(' '),
            }
          : clip
      )
    )
  }

  const handleSpeakerChange = (clipId: string, newSpeaker: string) => {
    setClips((prevClips) =>
      prevClips.map((clip) =>
        clip.id === clipId ? { ...clip, speaker: newSpeaker } : clip
      )
    )
  }

  const handleClipCheck = (clipId: string, checked: boolean) => {
    setCheckedClipIds((prev) => {
      if (checked) {
        return [...prev, clipId]
      } else {
        return prev.filter((id) => id !== clipId)
      }
    })
  }

  // Upload modal handler
  const wrappedHandleStartTranscription = (
    data: Parameters<typeof handleStartTranscription>[0]
  ) => {
    return handleStartTranscription(
      data,
      () => setIsUploadModalOpen(false),
      false
    )
  }

  // Merge clips handler
  const handleMergeClips = () => {
    try {
      // 선택된 클립과 체크된 클립 결합
      const allSelectedIds = [
        ...(selectedClipId ? [selectedClipId] : []),
        ...checkedClipIds,
      ]
      const uniqueSelectedIds = Array.from(new Set(allSelectedIds))

      // 선택된 클립이 1개 이하인 경우
      if (uniqueSelectedIds.length <= 1) {
        const currentClipId = uniqueSelectedIds[0] || selectedClipId
        if (!currentClipId) {
          showToast('합칠 클립을 선택해주세요.')
          return
        }

        // 현재 클립의 인덱스 찾기
        const currentIndex = clips.findIndex(
          (clip) => clip.id === currentClipId
        )
        if (currentIndex === -1) {
          showToast('선택된 클립을 찾을 수 없습니다.')
          return
        }

        // 다음 클립이 있는지 확인
        if (currentIndex >= clips.length - 1) {
          showToast('다음 클립이 존재하지 않습니다.')
          return
        }

        // 현재 클립과 다음 클립을 합치기 - Command 패턴 사용
        const nextClipId = clips[currentIndex + 1].id
        const clipsToMerge = [currentClipId, nextClipId]
        const command = new MergeClipsCommand(clips, [], clipsToMerge, setClips)

        editorHistory.executeCommand(command)
        setSelectedClipId(null)
        setCheckedClipIds([])
        showToast('클립이 성공적으로 합쳐졌습니다.', 'success')
        return
      }

      // 2개 이상의 클립이 선택된 경우
      if (!areClipsConsecutive(clips, uniqueSelectedIds)) {
        showToast(
          '선택된 클립들이 연속되어 있지 않습니다. 연속된 클립만 합칠 수 있습니다.'
        )
        return
      }

      // 클립 합치기 실행 - Command 패턴 사용
      const command = new MergeClipsCommand(
        clips,
        [],
        uniqueSelectedIds,
        setClips
      )

      editorHistory.executeCommand(command)
      setSelectedClipId(null)
      setCheckedClipIds([])
      showToast('클립이 성공적으로 합쳐졌습니다.', 'success')
    } catch (error) {
      console.error('클립 합치기 오류:', error)
      showToast(
        error instanceof Error
          ? error.message
          : '클립 합치기 중 오류가 발생했습니다.'
      )
    }
  }

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    if (editorHistory.canUndo()) {
      editorHistory.undo()
      showToast('작업이 되돌려졌습니다.', 'success')
    }
  }, [editorHistory])

  const handleRedo = useCallback(() => {
    if (editorHistory.canRedo()) {
      editorHistory.redo()
      showToast('작업이 다시 실행되었습니다.', 'success')
    }
  }, [editorHistory])

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Z (undo)
      if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        handleUndo()
      }
      // Ctrl+Shift+Z (redo)
      else if (event.ctrlKey && event.shiftKey && event.key === 'Z') {
        event.preventDefault()
        handleRedo()
      }
      // Ctrl+Y (redo - 대체 단축키)
      else if (event.ctrlKey && event.key === 'y') {
        event.preventDefault()
        handleRedo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleUndo, handleRedo])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="min-h-screen bg-gray-900 text-white">
        <EditorHeaderTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <Toolbar
          activeTab={activeTab}
          onNewClick={() => setIsUploadModalOpen(true)}
          onMergeClips={handleMergeClips}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={editorHistory.canUndo()}
          canRedo={editorHistory.canRedo()}
        />

        <div className="flex h-[calc(100vh-120px)]">
          <VideoSection />

          <div
            className="flex-1 flex justify-center relative"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <SubtitleEditList
              clips={clips}
              selectedClipId={selectedClipId}
              checkedClipIds={checkedClipIds}
              onClipSelect={setSelectedClipId}
              onClipCheck={handleClipCheck}
              onWordEdit={handleWordEdit}
              onSpeakerChange={handleSpeakerChange}
            />

            <SelectionBox
              startX={selectionBox.startX}
              startY={selectionBox.startY}
              endX={selectionBox.endX}
              endY={selectionBox.endY}
              isSelecting={isSelecting}
            />
          </div>
        </div>

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => !isTranscriptionLoading && setIsUploadModalOpen(false)}
          onFileSelect={handleFileSelect}
          onStartTranscription={wrappedHandleStartTranscription}
          acceptedTypes={['audio/*', 'video/*']}
          maxFileSize={100 * 1024 * 1024} // 100MB
          multiple={true}
          isLoading={isTranscriptionLoading}
        />
      </div>

      <DragOverlay
        dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.3',
              },
            },
          }),
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {activeId && <DragOverlayContent />}
      </DragOverlay>
    </DndContext>
  )
}
