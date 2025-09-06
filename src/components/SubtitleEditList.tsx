'use client'

import React from 'react'
import ClipComponent, { ClipItem } from '@/components/ClipComponent'

export interface SubtitleEditListProps {
  clips: ClipItem[]
  selectedClipId: string | null
  onClipSelect: (clipId: string) => void
  onWordEdit: (clipId: string, wordId: string, newText: string) => void
  onSpeakerChange?: (clipId: string, newSpeaker: string) => void
}

const SubtitleEditList: React.FC<SubtitleEditListProps> = ({
  clips,
  selectedClipId,
  onClipSelect,
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
            onSelect={onClipSelect}
            onWordEdit={onWordEdit}
            onSpeakerChange={onSpeakerChange}
          />
        ))}
      </div>
    </div>
  )
}

export default SubtitleEditList
