'use client'

import React from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import UnifiedClipComponent from './UnifiedClipComponent'
import { ClipItem } from '@/components/shared/ClipComponent'

interface SubtitleEditListProps {
  clips: ClipItem[]
  selectedClipId: string | null
  checkedClipIds?: string[]
  onClipSelect: (clipId: string | null) => void
  onClipCheck?: (clipId: string, checked: boolean) => void
  onWordEdit: (clipId: string, wordId: string, newText: string) => void
  onSpeakerChange?: (clipId: string, newSpeaker: string) => void
}

export default function SubtitleEditList({
  clips,
  selectedClipId,
  checkedClipIds = [],
  onClipSelect,
  onClipCheck,
  onWordEdit,
  onSpeakerChange,
}: SubtitleEditListProps) {
  return (
    <div className="w-[800px] bg-gray-900 p-4">
      <SortableContext
        items={clips.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {clips.map((clip) => (
            <UnifiedClipComponent
              key={clip.id}
              clip={clip}
              isSelected={selectedClipId === clip.id}
              isChecked={checkedClipIds.includes(clip.id)}
              isMultiSelected={false}
              enableDragAndDrop={true}
              onSelect={(clipId) => onClipSelect(clipId)}
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
