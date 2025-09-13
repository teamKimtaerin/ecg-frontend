'use client'

import React, { useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useEditorStore } from '../../store'
import MovableAnimatedText from './MovableAnimatedText'
import type { InsertedText, TextPosition } from '../../types/textInsertion'

interface TextInsertionOverlayProps {
  videoContainerRef: React.RefObject<HTMLDivElement | null>
  currentTime: number
  onTextClick?: (textId: string) => void
  onTextDoubleClick?: (textId: string) => void
}

export default function TextInsertionOverlay({
  videoContainerRef,
  currentTime,
  onTextClick,
  onTextDoubleClick,
}: TextInsertionOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Get text insertion state from store
  const {
    isInsertionMode,
    selectedTextId,
    addText,
    selectText,
    updateText,
    getActiveTexts,
    defaultStyle,
  } = useEditorStore()

  // Get currently active texts
  const activeTexts = getActiveTexts(currentTime)

  // Handle video container click for new text insertion
  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only handle clicks in insertion mode
      if (!isInsertionMode) return

      // Don't create text if clicking on existing text
      if ((e.target as HTMLElement).closest('[data-text-id]')) {
        return
      }

      const container = videoContainerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      // Create new text at click position
      const newTextData = {
        content: '텍스트를 입력하세요',
        position: { x, y },
        startTime: currentTime,
        endTime: currentTime + 3, // Default 3 seconds duration
        style: defaultStyle,
      }

      addText(newTextData)
    },
    [
      isInsertionMode,
      videoContainerRef,
      currentTime,
      addText,
      defaultStyle,
    ]
  )

  // Handle text selection
  const handleTextSelect = useCallback(
    (textId: string) => {
      selectText(textId)
      onTextClick?.(textId)
    },
    [selectText, onTextClick]
  )

  // Handle text double-click for editing
  const handleTextDoubleClick = useCallback(
    (textId: string) => {
      onTextDoubleClick?.(textId)
    },
    [onTextDoubleClick]
  )

  // Handle text updates from MovableAnimatedText
  const handleTextUpdate = useCallback(
    (textId: string, updates: Partial<InsertedText>) => {
      updateText(textId, updates)
    },
    [updateText]
  )

  // Don't render anything if no container
  if (!videoContainerRef.current) {
    return null
  }

  return createPortal(
    <div
      ref={overlayRef}
      className={`absolute inset-0 pointer-events-auto ${
        isInsertionMode ? 'cursor-crosshair' : 'cursor-default'
      }`}
      onClick={handleContainerClick}
      style={{ zIndex: 20 }}
    >
      {/* Render active texts with MovableAnimatedText */}
      {activeTexts.map((text) => (
        <MovableAnimatedText
          key={text.id}
          text={text}
          isSelected={text.id === selectedTextId}
          isVisible={true}
          videoContainerRef={videoContainerRef}
          onUpdate={(updates) => handleTextUpdate(text.id, updates)}
          onSelect={() => handleTextSelect(text.id)}
          onDoubleClick={() => handleTextDoubleClick(text.id)}
        />
      ))}
      
      {/* Insertion mode indicator */}
      {isInsertionMode && (
        <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium pointer-events-none">
          텍스트 삽입 모드
        </div>
      )}
    </div>,
    videoContainerRef.current
  )
}