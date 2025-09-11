'use client'

import React from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import ClipComponent, { ClipItem } from './ClipComponent'
import DropIndicator from './DropIndicator'
import { useEditorStore } from '../store'

interface SubtitleEditListProps {
  clips: ClipItem[]
  selectedClipIds: Set<string>
  activeClipId?: string | null
  speakers?: string[]
  speakerColors?: Record<string, string>
  onClipSelect: (clipId: string) => void
  onClipCheck?: (clipId: string, checked: boolean) => void
  onWordEdit: (clipId: string, wordId: string, newText: string) => void
  onSpeakerChange?: (clipId: string, newSpeaker: string) => void
  onBatchSpeakerChange?: (clipIds: string[], newSpeaker: string) => void
  onOpenSpeakerManagement?: () => void
  onAddSpeaker?: (name: string) => void
  onRenameSpeaker?: (oldName: string, newName: string) => void
  onEmptySpaceClick?: () => void
}

export default function SubtitleEditList({
  clips,
  selectedClipIds,
  activeClipId,
  speakers = [],
  speakerColors,
  onClipSelect,
  onClipCheck,
  onWordEdit,
  onSpeakerChange,
  onBatchSpeakerChange,
  onOpenSpeakerManagement,
  onAddSpeaker,
  onRenameSpeaker,
  onEmptySpaceClick,
}: SubtitleEditListProps) {
  const { overId, activeId } = useEditorStore()

  // 빈 공간 클릭 핸들러
  const handleEmptySpaceClick = (e: React.MouseEvent) => {
    // 클릭된 대상이 현재 div(배경)인 경우에만 처리
    if (e.target === e.currentTarget && onEmptySpaceClick) {
      onEmptySpaceClick()
    }
  }

  // 드래그 중인 클립의 현재 인덱스 찾기
  const draggedIndex = clips.findIndex((clip) => clip.id === activeId)
  const overIndex = clips.findIndex((clip) => clip.id === overId)

  return (
    <div
      className="w-[800px] bg-gray-50 p-4 cursor-pointer"
      onClick={handleEmptySpaceClick}
    >
      <SortableContext
        items={clips.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {clips.map((clip, index) => (
            <React.Fragment key={clip.id}>
              {/* 드롭 인디케이터 - 현재 위치 위에 표시 */}
              <DropIndicator
                isActive={
                  activeId !== null &&
                  overId === clip.id &&
                  draggedIndex !== -1 &&
                  overIndex !== -1 &&
                  draggedIndex > overIndex
                }
              />

              <ClipComponent
                clip={clip}
                index={index + 1} // 인덱스는 1부터 시작
                isSelected={activeClipId === clip.id} // 포커스 상태
                isChecked={selectedClipIds.has(clip.id)} // 체크박스 상태 (분리됨)
                isMultiSelected={selectedClipIds.has(clip.id)}
                enableDragAndDrop={selectedClipIds.has(clip.id)} // 체크된 클립만 드래그 가능
                speakers={speakers}
                speakerColors={speakerColors}
                onSelect={onClipSelect}
                onCheck={onClipCheck}
                onWordEdit={onWordEdit}
                onSpeakerChange={onSpeakerChange}
                onBatchSpeakerChange={onBatchSpeakerChange}
                onOpenSpeakerManagement={onOpenSpeakerManagement}
                onAddSpeaker={onAddSpeaker}
                onRenameSpeaker={onRenameSpeaker}
              />

              {/* 드롭 인디케이터 - 현재 위치 아래에 표시 */}
              <DropIndicator
                isActive={
                  activeId !== null &&
                  overId === clip.id &&
                  draggedIndex !== -1 &&
                  overIndex !== -1 &&
                  draggedIndex < overIndex
                }
              />
            </React.Fragment>
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
