'use client'

import React from 'react'
import { useEditorStore } from '../store'

export default function DragOverlayContent() {
  const { activeId, clips, selectedClipIds } = useEditorStore()

  const activeClip = clips.find((c) => c.id === activeId)

  if (!activeClip) return null

  return (
    <div className="bg-gray-200 rounded-lg p-4 shadow-2xl opacity-90 border-2 border-gray-400">
      <div className="text-sm font-semibold text-gray-800">
        {selectedClipIds.size > 1
          ? `Moving ${selectedClipIds.size} clips`
          : activeClip.fullText}
      </div>
    </div>
  )
}
