'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useEditorStore } from '../../store'
import type { TextPosition, InsertedText } from '../../types/textInsertion'

interface TextInsertionOverlayProps {
  videoContainerRef: React.RefObject<HTMLDivElement | null>
  currentTime: number
  onTextClick?: (textId: string) => void
  onTextDoubleClick?: (textId: string) => void
}

interface DragState {
  isDragging: boolean
  dragTextId: string | null
  startPosition: { x: number; y: number }
  initialTextPosition: TextPosition
}

export default function TextInsertionOverlay({
  videoContainerRef,
  currentTime,
  onTextClick,
  onTextDoubleClick,
}: TextInsertionOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragTextId: null,
    startPosition: { x: 0, y: 0 },
    initialTextPosition: { x: 0, y: 0 },
  })

  // Get text insertion state from store
  const {
    insertedTexts,
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
  const handleTextClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, textId: string) => {
      e.stopPropagation()
      selectText(textId)
      onTextClick?.(textId)
    },
    [selectText, onTextClick]
  )

  // Handle text double-click for editing
  const handleTextDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, textId: string) => {
      e.stopPropagation()
      onTextDoubleClick?.(textId)
    },
    [onTextDoubleClick]
  )

  // Handle drag start
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, textId: string) => {
      e.stopPropagation()
      
      const text = insertedTexts.find((t) => t.id === textId)
      if (!text) return

      setDragState({
        isDragging: true,
        dragTextId: textId,
        startPosition: { x: e.clientX, y: e.clientY },
        initialTextPosition: text.position,
      })

      selectText(textId)
    },
    [insertedTexts, selectText]
  )

  // Handle drag move
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging || !dragState.dragTextId) return

      const container = videoContainerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const deltaX = e.clientX - dragState.startPosition.x
      const deltaY = e.clientY - dragState.startPosition.y

      // Convert pixel delta to percentage
      const deltaXPercent = (deltaX / rect.width) * 100
      const deltaYPercent = (deltaY / rect.height) * 100

      const newPosition = {
        x: Math.max(0, Math.min(100, dragState.initialTextPosition.x + deltaXPercent)),
        y: Math.max(0, Math.min(100, dragState.initialTextPosition.y + deltaYPercent)),
      }

      updateText(dragState.dragTextId, { position: newPosition })
    },
    [dragState, videoContainerRef, updateText]
  )

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState({
        isDragging: false,
        dragTextId: null,
        startPosition: { x: 0, y: 0 },
        initialTextPosition: { x: 0, y: 0 },
      })
    }
  }, [dragState.isDragging])

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp])

  // Render text element
  const renderText = (text: InsertedText) => {
    const isSelected = text.id === selectedTextId
    const isDragging = dragState.dragTextId === text.id

    return (
      <div
        key={text.id}
        data-text-id={text.id}
        className={`absolute select-none cursor-pointer transition-all duration-200 ${
          isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
        } ${isDragging ? 'z-50' : 'z-10'}`}
        style={{
          left: `${text.position.x}%`,
          top: `${text.position.y}%`,
          transform: 'translate(-50%, -50%)',
          fontSize: `${text.style.fontSize}px`,
          fontFamily: text.style.fontFamily,
          color: text.style.color,
          backgroundColor: text.style.backgroundColor,
          fontWeight: text.style.fontWeight,
          fontStyle: text.style.fontStyle,
          textAlign: text.style.textAlign,
          textShadow: text.style.textShadow,
          borderRadius: text.style.borderRadius ? `${text.style.borderRadius}px` : undefined,
          padding: text.style.padding ? `${text.style.padding}px` : undefined,
          opacity: text.style.opacity,
          maxWidth: '80%',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
        onClick={(e) => handleTextClick(e, text.id)}
        onDoubleClick={(e) => handleTextDoubleClick(e, text.id)}
        onMouseDown={(e) => handleMouseDown(e, text.id)}
      >
        {text.content}
        
        {/* Selection handles */}
        {isSelected && !isDragging && (
          <>
            {/* Corner handles for resizing (placeholder for future implementation) */}
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full opacity-80" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full opacity-80" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full opacity-80" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full opacity-80" />
          </>
        )}
      </div>
    )
  }

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
      {/* Render active texts */}
      {activeTexts.map(renderText)}
      
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