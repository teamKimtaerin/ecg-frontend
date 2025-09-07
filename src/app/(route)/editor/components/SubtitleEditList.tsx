'use client'

import React from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import ClipComponent, { ClipItem } from './ClipComponent'

interface SubtitleEditListProps {
  clips: ClipItem[]
  selectedClipIds: Set<string>
  activeClipId?: string | null
  onClipSelect: (clipId: string) => void
  onClipCheck?: (clipId: string, checked: boolean) => void
  onWordEdit: (clipId: string, wordId: string, newText: string) => void
  onSpeakerChange?: (clipId: string, newSpeaker: string) => void
  onEmptySpaceClick?: () => void
}

export default function SubtitleEditList({
  clips,
  selectedClipIds,
  activeClipId,
  onClipSelect,
  onClipCheck,
  onWordEdit,
  onSpeakerChange,
  onEmptySpaceClick,
}: SubtitleEditListProps) {
  // 빈 공간 클릭 핸들러
  const handleEmptySpaceClick = (e: React.MouseEvent) => {
    // 클릭된 대상이 현재 div(배경)인 경우에만 처리
    if (e.target === e.currentTarget && onEmptySpaceClick) {
      onEmptySpaceClick()
    }
  }
  return (
    <div className="w-[800px] bg-gray-900 p-4" onClick={handleEmptySpaceClick}>
      <SortableContext
        items={clips.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {clips.map((clip, index) => (
            <ClipComponent
              key={clip.id}
              clip={clip}
              index={index + 1} // 인덱스는 1부터 시작
              isSelected={activeClipId === clip.id} // 포커스 상태
              isChecked={selectedClipIds.has(clip.id)} // 체크박스 상태 (분리됨)
              isMultiSelected={selectedClipIds.has(clip.id)}
              enableDragAndDrop={true}
              onSelect={onClipSelect}
              onCheck={onClipCheck}
              onWordEdit={onWordEdit}
              onSpeakerChange={onSpeakerChange}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
