'use client'

import React from 'react'
import ClipComponent, { ClipItem } from '@/components/shared/ClipComponent'

export interface SubtitleEditListProps {
  clips: ClipItem[]
  selectedClipId: string | null
  checkedClipIds?: string[]
  onClipSelect: (clipId: string) => void
  onClipCheck?: (clipId: string, checked: boolean) => void
  onWordEdit: (clipId: string, wordId: string, newText: string) => void
  onSpeakerChange?: (clipId: string, newSpeaker: string) => void
}

const SubtitleEditList: React.FC<SubtitleEditListProps> = ({
  clips,
  selectedClipId,
  checkedClipIds = [],
  onClipSelect,
  onClipCheck,
  onWordEdit,
  onSpeakerChange,
}) => {
  return (
    <div className="w-[800px] bg-gray-900 p-4">
      <div className="space-y-3">
        {clips.map((clip) => (
          <ClipComponent
            key={clip.id}
            clip={clip}
            isSelected={selectedClipId === clip.id}
            isChecked={checkedClipIds.includes(clip.id)}
            onSelect={onClipSelect}
            onCheck={onClipCheck}
            onWordEdit={onWordEdit}
            onSpeakerChange={onSpeakerChange}
          />
        ))}
      </div>
    </div>
  )
}

export default SubtitleEditList
