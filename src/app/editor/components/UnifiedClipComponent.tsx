'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ClipComponent, { ClipItem } from '@/components/shared/ClipComponent'

interface UnifiedClipComponentProps {
  clip: ClipItem
  isSelected: boolean
  isMultiSelected?: boolean
  isChecked?: boolean
  enableDragAndDrop?: boolean
  onSelect: (clipId: string) => void
  onCheck?: (clipId: string, checked: boolean) => void
  onWordEdit: (clipId: string, wordId: string, newText: string) => void
  onSpeakerChange?: (clipId: string, newSpeaker: string) => void
}

export default function UnifiedClipComponent({
  clip,
  isSelected,
  isMultiSelected,
  isChecked,
  enableDragAndDrop = false,
  onSelect,
  onCheck,
  onWordEdit,
  onSpeakerChange,
}: UnifiedClipComponentProps) {
  // Sortable hook for drag and drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: clip.id,
    disabled: !enableDragAndDrop,
  })

  const style = enableDragAndDrop
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined

  const dragProps = enableDragAndDrop
    ? {
        ref: setNodeRef,
        style,
        ...attributes,
        ...listeners,
      }
    : {}

  return (
    <div {...dragProps}>
      <ClipComponent
        clip={clip}
        isSelected={isSelected}
        isChecked={isChecked}
        isMultiSelected={isMultiSelected}
        onSelect={onSelect}
        onCheck={onCheck}
        onWordEdit={onWordEdit}
        onSpeakerChange={onSpeakerChange}
      />
    </div>
  )
}
