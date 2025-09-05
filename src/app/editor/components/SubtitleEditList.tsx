'use client'

import React from 'react'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import SortableClipComponent from '@/components/SortableClipComponent'
import { useEditorStore } from '../store'

export default function SubtitleEditList() {
  const { 
    clips, 
    selectedClipIds, 
    toggleClipSelection, 
    updateClipWords 
  } = useEditorStore()

  return (
    <div className="w-[800px] bg-gray-900 p-4">
      <SortableContext
        items={clips.map(c => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {clips.map((clip) => (
            <SortableClipComponent
              key={clip.id}
              clip={clip}
              isSelected={selectedClipIds.has(clip.id)}
              isMultiSelected={selectedClipIds.size > 1 && selectedClipIds.has(clip.id)}
              onSelect={toggleClipSelection}
              onWordEdit={updateClipWords}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}