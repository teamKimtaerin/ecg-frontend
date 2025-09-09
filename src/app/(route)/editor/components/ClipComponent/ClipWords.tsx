import React, { useCallback } from 'react'
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Word } from './types'
import ClipWord from './ClipWord'
import { useWordDragAndDrop } from '../../hooks/useWordDragAndDrop'
import { useWordGrouping } from '../../hooks/useWordGrouping'
import { useEditorStore } from '../../store'

interface ClipWordsProps {
  clipId: string
  words: Word[]
  onWordEdit: (clipId: string, wordId: string, newText: string) => void
}

export default function ClipWords({
  clipId,
  words,
  onWordEdit,
}: ClipWordsProps) {
  const {
    setFocusedWord,
    clearWordFocus,
    focusedWordId,
    focusedClipId,
    draggedWordId,
    setActiveClipId,
  } = useEditorStore()

  // Setup drag and drop for words
  const {
    sensors,
    handleWordDragStart,
    handleWordDragOver,
    handleWordDragEnd,
    handleWordDragCancel,
  } = useWordDragAndDrop(clipId)

  // Setup grouping functionality
  const {
    containerRef,
    isDragging: isGroupDragging,
    handleMouseDown,
    handleKeyDown,
    groupedWordIds,
  } = useWordGrouping({
    clipId,
    onGroupChange: (groupedIds) => {
      // Optional: Handle group change
    },
  })

  // Handle word click
  const handleWordClick = useCallback(
    (wordId: string, isCenter: boolean) => {
      if (isCenter) {
        // Focus the word and its parent clip
        setFocusedWord(clipId, wordId)
        setActiveClipId(clipId)
      } else {
        // Focus only the clip component
        clearWordFocus()
        setActiveClipId(clipId)
      }
    },
    [clipId, setFocusedWord, clearWordFocus, setActiveClipId]
  )

  // Create sortable items for DnD
  const sortableItems = words.map((word) => `${clipId}-${word.id}`)

  // Find the dragged word for overlay
  const draggedWord = words.find((w) => w.id === draggedWordId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleWordDragStart}
      onDragOver={handleWordDragOver}
      onDragEnd={handleWordDragEnd}
      onDragCancel={handleWordDragCancel}
    >
      <SortableContext
        items={sortableItems}
        strategy={horizontalListSortingStrategy}
      >
        <div
          ref={containerRef}
          className="flex flex-wrap gap-1 relative"
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {words.map((word, index) => (
            <ClipWord
              key={word.id}
              word={word}
              clipId={clipId}
              index={index}
              onWordClick={handleWordClick}
              onWordEdit={onWordEdit}
            />
          ))}

          {/* Visual feedback for group selection */}
          {isGroupDragging && (
            <div className="absolute inset-0 bg-blue-500/10 pointer-events-none rounded" />
          )}
        </div>
      </SortableContext>

      {/* Drag overlay for better visual feedback */}
      <DragOverlay>
        {draggedWord && (
          <div className="bg-blue-500 text-white px-2 py-1 rounded text-sm shadow-lg opacity-90">
            {groupedWordIds.size > 1
              ? `${groupedWordIds.size} words`
              : draggedWord.text}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
