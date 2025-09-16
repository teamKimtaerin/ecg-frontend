'use client'

import React, { useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useEditorStore } from '../../store'
import MovableAnimatedText from './MovableAnimatedText'
import type { InsertedText } from '../../types/textInsertion'

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
  const { selectedTextId, selectText, updateText, getActiveTexts } =
    useEditorStore()

  // Get currently active texts
  const activeTexts = getActiveTexts(currentTime)

  // Handle video container click (no longer used for text insertion)
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      console.log('🎬 VIDEO CONTAINER CLICKED:', {
        target: e.target,
        currentTarget: e.currentTarget,
        isDirectClick: e.target === e.currentTarget,
        targetTagName: (e.target as HTMLElement).tagName,
        targetClassName: (e.target as HTMLElement).className,
      })

      // Only handle clicks on the container itself, not on child elements
      if (e.target === e.currentTarget) {
        console.log('🔄 Clearing text selection (clicked on empty area)')
        selectText(null)
      } else {
        console.log('👆 Click on child element, ignoring')
      }
    },
    [selectText]
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
      className="absolute inset-0 pointer-events-auto cursor-default"
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
    </div>,
    videoContainerRef.current
  )
}
