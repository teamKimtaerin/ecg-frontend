'use client'

import React, { useState } from 'react'
import { ClipComponentProps } from './types'
import ClipTimeline from './ClipTimeline'
import ClipCheckbox from './ClipCheckbox'
import ClipSpeaker from './ClipSpeaker'
import ClipWords from './ClipWords'
import ClipText from './ClipText'
import ExpandedClipWaveform from './ExpandedClipWaveform'
import { useClipDragAndDrop } from '../../hooks/useClipDragAndDrop'
import { useClipStyles } from '../../hooks/useClipStyles'
import { useEditorStore } from '../../store'

export default function ClipComponent({
  clip,
  index,
  isSelected,
  isChecked = false,
  isMultiSelected = false,
  enableDragAndDrop = false,
  speakers = [],
  onSelect,
  onCheck,
  onWordEdit,
  onSpeakerChange,
  onBatchSpeakerChange,
  onOpenSpeakerManagement,
  onAddSpeaker,
  onRenameSpeaker,
}: ClipComponentProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { expandedClipId, focusedWordId } = useEditorStore()
  const isExpanded = expandedClipId === clip.id

  const { dragProps, isDragging } = useClipDragAndDrop(
    clip.id,
    enableDragAndDrop && !isExpanded // Disable drag when expanded
  )
  const { containerClassName, sidebarClassName, contentClassName } =
    useClipStyles({
      isSelected,
      isChecked,
      isMultiSelected,
      isHovered,
      isDragging,
    })

  const handleClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent selection box from triggering
    e.stopPropagation()
    onSelect(clip.id)
  }

  return (
    <div
      {...dragProps}
      className={`sortable-clip ${containerClassName}`}
      data-clip-id={clip.id}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex">
        {/* Left sidebar - extends when expanded */}
        <div
          className={`${sidebarClassName} ${isExpanded ? 'self-stretch' : ''}`}
        >
          <ClipTimeline index={index} />
          <ClipCheckbox
            clipId={clip.id}
            isChecked={isChecked}
            onCheck={onCheck}
          />
          {isExpanded && <div className="flex-1" />}
        </div>

        {/* Right content area */}
        <div className="flex-1 flex flex-col">
          {/* Main content */}
          <div className={contentClassName}>
            {/* Upper section */}
            <div className="p-3">
              <div className="grid grid-cols-[180px_1fr] gap-3 items-center">
                <div className="flex items-center gap-3 pl-4 h-8 flex-shrink-0">
                  <ClipSpeaker
                    clipId={clip.id}
                    speaker={clip.speaker}
                    speakers={speakers}
                    onSpeakerChange={onSpeakerChange}
                    onBatchSpeakerChange={onBatchSpeakerChange}
                    onOpenSpeakerManagement={onOpenSpeakerManagement}
                    onAddSpeaker={onAddSpeaker}
                    onRenameSpeaker={onRenameSpeaker}
                  />
                </div>
                <div className="overflow-hidden min-w-0 min-h-[32px] flex items-center">
                  <ClipWords
                    clipId={clip.id}
                    words={clip.words}
                    onWordEdit={onWordEdit}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#383842]" />

            {/* Lower section */}
            <ClipText fullText={clip.fullText} />
          </div>

          {/* Expanded Waveform Editor - positioned beside sidebar */}
          {isExpanded && (
            <ExpandedClipWaveform
              clipId={clip.id}
              words={clip.words}
              focusedWordId={focusedWordId}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Re-export types for convenience
export type { ClipItem, ClipComponentProps } from './types'
