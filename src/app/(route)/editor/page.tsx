'use client'

import {
  DndContext,
  DragOverlay,
  closestCenter,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import { useCallback, useEffect, useId, useState } from 'react'

// Store
import { useEditorStore } from './store'

// Types
import { EditorTab } from './types'

// Hooks
import { useUploadModal } from '@/hooks/useUploadModal'
import { useDragAndDrop } from './hooks/useDragAndDrop'
import { useSelectionBox } from './hooks/useSelectionBox'

// Components
import SelectionBox from '@/components/DragDrop/SelectionBox'
import UploadModal from '@/components/UploadModal'
import ResizablePanelDivider from '@/components/ui/ResizablePanelDivider'
import Toolbars from './components/Toolbars'
import DragOverlayContent from './components/DragOverlayContent'
import EditorHeaderTabs from './components/EditorHeaderTabs'
import SubtitleEditList from './components/SubtitleEditList'
import VideoSection from './components/VideoSection'

// Utils
import { EditorHistory } from '@/utils/editor/EditorHistory'
import { areClipsConsecutive } from '@/utils/editor/clipMerger'
import { MergeClipsCommand } from '@/utils/editor/commands/MergeClipsCommand'
import { SplitClipCommand } from '@/utils/editor/commands/SplitClipCommand'
import { DeleteClipCommand } from '@/utils/editor/commands/DeleteClipCommand'
import { showToast } from '@/utils/ui/toast'

export default function EditorPage() {
  // Store state for DnD and selection
  const {
    activeId,
    clips,
    setClips,
    selectedClipIds,
    setSelectedClipIds,
    clearSelection,
    updateClipWords,
    saveProject,
    activeClipId,
    setActiveClipId,
    videoPanelWidth,
    setVideoPanelWidth,
  } = useEditorStore()

  // Local state
  const [activeTab, setActiveTab] = useState<EditorTab>('home')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [editorHistory] = useState(() => new EditorHistory())
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1920
  )

  // Generate stable ID for DndContext to prevent hydration mismatch
  const dndContextId = useId()

  // Upload modal hook
  const { isTranscriptionLoading, handleFileSelect, handleStartTranscription } =
    useUploadModal()

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

  // Panel resize handler
  const handlePanelResize = useCallback(
    (delta: number) => {
      const newWidth = videoPanelWidth + delta
      const minWidth = 300 // Minimum width
      const maxWidth = windowWidth / 2 // Maximum 50% of viewport

      // Constrain the width between min and max
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
      setVideoPanelWidth(constrainedWidth)

      // Save to localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'editor-video-panel-width',
          constrainedWidth.toString()
        )
      }
    },
    [videoPanelWidth, windowWidth, setVideoPanelWidth]
  )

  // Edit handlers
  const handleWordEdit = (clipId: string, wordId: string, newText: string) => {
    updateClipWords(clipId, wordId, newText)
  }

  const handleSpeakerChange = (clipId: string, newSpeaker: string) => {
    const updatedClips = clips.map((clip) =>
      clip.id === clipId ? { ...clip, speaker: newSpeaker } : clip
    )
    setClips(updatedClips)
  }

  const handleClipCheck = (clipId: string, checked: boolean) => {
    if (checked) {
      const newSet = new Set(selectedClipIds)
      newSet.add(clipId)
      setSelectedClipIds(newSet)
    } else {
      const newSet = new Set(selectedClipIds)
      newSet.delete(clipId)
      setSelectedClipIds(newSet)
    }
  }

  const handleClipSelect = (clipId: string) => {
    // 체크된 클립이 있으면 모든 선택 해제, 없으면 포커스만 변경
    if (selectedClipIds.size > 0) {
      clearSelection()
      setActiveClipId(null) // 선택 해제 시 포커스도 해제
    } else {
      setActiveClipId(clipId)
    }
  }

  // 빈 공간 클릭 시 모든 선택 해제
  const handleEmptySpaceClick = () => {
    if (selectedClipIds.size > 0) {
      clearSelection()
      setActiveClipId(null)
    }
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
  const handleMergeClips = useCallback(() => {
    try {
      // Get selected clips from store
      const uniqueSelectedIds = Array.from(selectedClipIds)

      // 체크된 클립이 있으면 기존 로직 사용 (2개 이상 선택된 경우)
      if (uniqueSelectedIds.length >= 2) {
        // 2개 이상의 클립이 선택된 경우 - 기존 로직
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
        clearSelection()
        return
      }

      // 체크된 클립이 0~1개인 경우: 포커스된 클립과 다음 클립을 합치기
      if (!activeClipId) {
        showToast('합칠 클립을 선택해주세요.')
        return
      }

      // 포커스된 클립의 인덱스 찾기
      const currentIndex = clips.findIndex((clip) => clip.id === activeClipId)
      if (currentIndex === -1) {
        showToast('포커스된 클립을 찾을 수 없습니다.')
        return
      }

      // 다음 클립이 있는지 확인
      if (currentIndex >= clips.length - 1) {
        showToast('다음 클립이 존재하지 않습니다.')
        return
      }

      // 포커스된 클립과 다음 클립을 합치기
      const nextClipId = clips[currentIndex + 1].id
      const clipsToMerge = [activeClipId, nextClipId]
      const command = new MergeClipsCommand(clips, [], clipsToMerge, setClips)

      editorHistory.executeCommand(command)
      clearSelection()
    } catch (error) {
      console.error('클립 합치기 오류:', error)
      showToast(
        error instanceof Error
          ? error.message
          : '클립 합치기 중 오류가 발생했습니다.'
      )
    }
  }, [
    clips,
    selectedClipIds,
    activeClipId,
    clearSelection,
    setClips,
    editorHistory,
  ])

  // Split clip handler
  const handleSplitClip = useCallback(() => {
    try {
      if (!activeClipId) {
        showToast('나눌 클립을 선택해주세요.')
        return
      }

      // 포커싱된 클립 찾기
      const targetClip = clips.find((clip) => clip.id === activeClipId)
      if (!targetClip) {
        showToast('선택된 클립을 찾을 수 없습니다.')
        return
      }

      // 단어가 2개 이상인지 확인
      if (targetClip.words.length <= 1) {
        showToast('클립을 나누려면 단어가 2개 이상이어야 합니다.')
        return
      }

      // 클립 나누기 실행 - Command 패턴 사용
      const command = new SplitClipCommand(clips, activeClipId, setClips)
      editorHistory.executeCommand(command)

      // 나눈 후 첫 번째 클립에 포커스 유지 (새로 생성된 첫 번째 클립)
      // SplitClipCommand가 실행되면 원본 클립이 두 개로 나뉘므로
      // 첫 번째 나뉜 클립의 ID를 찾아서 포커스
      setTimeout(() => {
        const updatedClips = clips
        const originalIndex = clips.findIndex(
          (clip) => clip.id === activeClipId
        )
        if (originalIndex !== -1 && updatedClips.length > originalIndex) {
          const newFirstClip = updatedClips[originalIndex]
          setActiveClipId(newFirstClip.id)
        }
      }, 0)
    } catch (error) {
      console.error('클립 나누기 오류:', error)
      showToast(
        error instanceof Error
          ? error.message
          : '클립 나누기 중 오류가 발생했습니다.'
      )
    }
  }, [activeClipId, clips, setClips, editorHistory, setActiveClipId])

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    if (editorHistory.canUndo()) {
      editorHistory.undo()
    }
  }, [editorHistory])

  const handleRedo = useCallback(() => {
    if (editorHistory.canRedo()) {
      editorHistory.redo()
    }
  }, [editorHistory])

  // Delete clip handler
  const handleDeleteClip = useCallback(() => {
    try {
      if (!activeClipId) {
        showToast('삭제할 클립을 선택해주세요.')
        return
      }

      // 클립이 1개뿐이면 삭제 불가
      if (clips.length <= 1) {
        showToast('마지막 클립은 삭제할 수 없습니다.')
        return
      }

      // 삭제할 클립 찾기
      const targetClipIndex = clips.findIndex(
        (clip) => clip.id === activeClipId
      )
      if (targetClipIndex === -1) {
        showToast('삭제할 클립을 찾을 수 없습니다.')
        return
      }

      // 클립 삭제 실행 - Command 패턴 사용
      const command = new DeleteClipCommand(clips, activeClipId, setClips)
      editorHistory.executeCommand(command)

      // 삭제 후 포커스 이동: 다음 클립이 있으면 다음, 없으면 이전 클립
      let nextFocusIndex = targetClipIndex
      if (targetClipIndex >= clips.length - 1) {
        // 마지막 클립을 삭제한 경우, 이전 클립으로 포커스
        nextFocusIndex = Math.max(0, targetClipIndex - 1)
      }

      // 새로운 클립 목록에서 포커스할 클립 ID 찾기
      setTimeout(() => {
        const updatedClips = clips.filter((clip) => clip.id !== activeClipId)
        if (updatedClips.length > 0 && nextFocusIndex < updatedClips.length) {
          setActiveClipId(updatedClips[nextFocusIndex].id)
        }
      }, 0)

      showToast('클립이 삭제되었습니다.', 'success')
    } catch (error) {
      console.error('클립 삭제 오류:', error)
      showToast(
        error instanceof Error
          ? error.message
          : '클립 삭제 중 오류가 발생했습니다.'
      )
    }
  }, [activeClipId, clips, setClips, editorHistory, setActiveClipId])

  // TODO : 자동 저장 기능 나중에 사용
  // useEffect(() => {
  //   const autoSave = () => {
  //     if (clips.length > 0) {
  //       saveProject().catch((error) => {
  //         console.error('Auto-save failed:', error)
  //       })
  //     }
  //   }

  //   const interval = setInterval(autoSave, 3000) // 3초마다 자동 저장
  //   return () => clearInterval(interval)
  // }, [clips, saveProject])

  // 키보드 단축키 처리 (macOS Command + Windows/Linux Ctrl 지원)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 입력 필드에서는 단축키 비활성화
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const cmdOrCtrl = event.metaKey || event.ctrlKey

      // Command/Ctrl+Z (undo)
      if (cmdOrCtrl && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        handleUndo()
      }
      // Command/Ctrl+Shift+Z (redo)
      else if (cmdOrCtrl && event.shiftKey && event.key === 'Z') {
        event.preventDefault()
        handleRedo()
      }
      // Command/Ctrl+Y (redo - 대체 단축키)
      else if (cmdOrCtrl && event.key === 'y') {
        event.preventDefault()
        handleRedo()
      }
      // Command/Ctrl+S (save)
      else if (cmdOrCtrl && event.key === 's') {
        event.preventDefault()
        saveProject()
          .then(() => {
            showToast('프로젝트가 저장되었습니다.', 'success')
          })
          .catch((error) => {
            console.error('Save failed:', error)
            showToast('저장에 실패했습니다.')
          })
      }
      // Command/Ctrl+E (merge clips) - 윈도우에서는 Ctrl+E
      else if (cmdOrCtrl && event.key === 'e') {
        event.preventDefault()
        handleMergeClips()
      }
      // Command/Ctrl+X (cut/delete clip) - 윈도우에서는 Ctrl+X, Mac에서는 Command+X
      else if (cmdOrCtrl && event.key === 'x') {
        event.preventDefault()
        handleDeleteClip()
      }
      // Enter (split clip) - 포커싱된 클립 나누기
      else if (event.key === 'Enter' && !cmdOrCtrl) {
        event.preventDefault()
        handleSplitClip()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    handleUndo,
    handleRedo,
    saveProject,
    handleMergeClips,
    handleSplitClip,
    handleDeleteClip,
  ])

  // 에디터 진입 시 첫 번째 클립에 자동 포커스 및 패널 너비 복원
  useEffect(() => {
    if (clips.length > 0 && !activeClipId) {
      setActiveClipId(clips[0].id)
    }

    // Restore panel width from localStorage
    if (typeof window !== 'undefined') {
      const savedWidth = localStorage.getItem('editor-video-panel-width')
      if (savedWidth) {
        const width = parseInt(savedWidth, 10)
        if (!isNaN(width)) {
          setVideoPanelWidth(width)
        }
      }
    }
  }, [clips, activeClipId, setActiveClipId, setVideoPanelWidth])

  // Window resize handler to update max width constraint
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      // Adjust video panel width if it exceeds new max
      const maxWidth = window.innerWidth / 2
      if (videoPanelWidth > maxWidth) {
        setVideoPanelWidth(maxWidth)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [videoPanelWidth, setVideoPanelWidth])

  // 클립이 변경되었을 때 포커스 유지/이동 로직
  useEffect(() => {
    if (clips.length === 0) {
      setActiveClipId(null)
      return
    }

    // 현재 포커싱된 클립이 없거나 존재하지 않으면 첫 번째 클립에 포커스
    if (!activeClipId || !clips.find((clip) => clip.id === activeClipId)) {
      setActiveClipId(clips[0].id)
    }
  }, [clips, activeClipId, setActiveClipId])

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="min-h-screen bg-gray-900 text-white">
        <EditorHeaderTabs
          activeTab={activeTab}
          onTabChange={(tabId: string) => setActiveTab(tabId as EditorTab)}
        />

        <Toolbars
          activeTab={activeTab}
          clips={clips}
          selectedClipIds={selectedClipIds}
          activeClipId={activeClipId}
          canUndo={editorHistory.canUndo()}
          canRedo={editorHistory.canRedo()}
          onSelectionChange={setSelectedClipIds}
          onNewClick={() => setIsUploadModalOpen(true)}
          onMergeClips={handleMergeClips}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onCut={() => console.log('Cut clips')}
          onCopy={() => console.log('Copy clips')}
          onPaste={() => console.log('Paste clips')}
          onSplitClip={handleSplitClip}
        />

        <div className="flex h-[calc(100vh-120px)] relative">
          <VideoSection width={videoPanelWidth} />

          <ResizablePanelDivider
            orientation="vertical"
            onResize={handlePanelResize}
            className="z-10"
          />

          <div
            className="flex-1 flex justify-center relative overflow-hidden"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <SubtitleEditList
              clips={clips}
              selectedClipIds={selectedClipIds}
              activeClipId={activeClipId}
              onClipSelect={handleClipSelect}
              onClipCheck={handleClipCheck}
              onWordEdit={handleWordEdit}
              onSpeakerChange={handleSpeakerChange}
              onEmptySpaceClick={handleEmptySpaceClick}
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
