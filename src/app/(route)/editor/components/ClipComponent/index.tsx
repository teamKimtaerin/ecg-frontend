'use client'

import React, { useState } from 'react'
import { ClipComponentProps } from './types'
import ClipTimeline from './ClipTimeline'
import ClipCheckbox from './ClipCheckbox'
import ClipSpeaker from './ClipSpeaker'
import ClipWords from './ClipWords'
import ClipText from './ClipText'
import { useSpeakerManagement } from '../../hooks/useSpeakerManagement'
import { useClipDragAndDrop } from '../../hooks/useClipDragAndDrop'
import { useClipStyles } from '../../hooks/useClipStyles'

export default function ClipComponent({
  clip,
  isSelected,
  isChecked = false,
  isMultiSelected = false,
  enableDragAndDrop = false,
  onSelect,
  onCheck,
  onWordEdit,
  onSpeakerChange,
}: ClipComponentProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [mouseDownTime, setMouseDownTime] = useState<number | null>(null)
  const [mouseDownPosition, setMouseDownPosition] = useState<{
    x: number
    y: number
  } | null>(null)

  const { speakers } = useSpeakerManagement()
  const { dragProps, isDragging } = useClipDragAndDrop(
    clip.id,
    enableDragAndDrop
  )
  const { containerClassName, sidebarClassName, contentClassName } =
    useClipStyles({
      isSelected,
      isChecked,
      isMultiSelected,
      isHovered,
      isDragging,
    })

  // 클릭과 드래그를 구분하는 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseDownTime(Date.now())
    setMouseDownPosition({ x: e.clientX, y: e.clientY })
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!mouseDownTime || !mouseDownPosition) return

    const clickDuration = Date.now() - mouseDownTime
    const mouseDistance = Math.sqrt(
      Math.pow(e.clientX - mouseDownPosition.x, 2) +
        Math.pow(e.clientY - mouseDownPosition.y, 2)
    )

    // 짧은 시간(200ms 이하)이고 이동거리가 적으면(5px 이하) 클릭으로 판정
    if (clickDuration <= 200 && mouseDistance <= 5) {
      onSelect(clip.id)
    }

    // 상태 초기화
    setMouseDownTime(null)
    setMouseDownPosition(null)
  }

  return (
    <div
      {...dragProps}
      className={`sortable-clip ${containerClassName}`}
      data-clip-id={clip.id}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex">
        {/* Left sidebar */}
        <div className={sidebarClassName}>
          <ClipTimeline timeline={clip.timeline} />
          <ClipCheckbox
            clipId={clip.id}
            isChecked={isChecked}
            onCheck={onCheck}
          />
        </div>

        {/* Right content */}
        <div className={contentClassName}>
          {/* Upper section */}
          <div className="p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center flex-1 pl-4">
                <ClipSpeaker
                  clipId={clip.id}
                  speaker={clip.speaker}
                  speakers={speakers}
                  onSpeakerChange={onSpeakerChange}
                />
                <div className="w-12" />
                <ClipWords
                  clipId={clip.id}
                  words={clip.words}
                  onWordEdit={onWordEdit}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-400" />

          {/* Lower section */}
          <ClipText fullText={clip.fullText} />
        </div>
      </div>
    </div>
  )
}

// Re-export types for convenience
export type { ClipItem, ClipComponentProps } from './types'
