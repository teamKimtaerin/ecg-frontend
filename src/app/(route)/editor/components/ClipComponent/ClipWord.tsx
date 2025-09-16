import React, { useRef, useCallback, useState, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Word } from './types'
import { useEditorStore } from '../../store'

interface ClipWordProps {
  word: Word
  clipId: string
  onWordClick: (wordId: string, isCenter: boolean) => void
  onWordEdit: (clipId: string, wordId: string, newText: string) => void
}

export default function ClipWord({
  word,
  clipId,
  onWordClick,
  onWordEdit,
}: ClipWordProps) {
  const wordRef = useRef<HTMLDivElement>(null)
  const editableRef = useRef<HTMLSpanElement>(null)
  const [lastClickTime, setLastClickTime] = useState(0)
  const [editingText, setEditingText] = useState(word.text)

  const {
    focusedWordId,
    focusedClipId,
    groupedWordIds,
    draggedWordId,
    dropTargetWordId,
    dropPosition,
    canDragWord,
    editingWordId,
    editingClipId,
    startInlineEdit,
    endInlineEdit,
    setIsAssetSidebarOpen,
    expandClip,
  } = useEditorStore()

  const isFocused = focusedWordId === word.id && focusedClipId === clipId
  const isInGroup = groupedWordIds.has(word.id)
  const isDraggable = canDragWord(word.id)
  const isBeingDragged = draggedWordId === word.id
  const isDropTarget = dropTargetWordId === word.id
  const isEditing = editingWordId === word.id && editingClipId === clipId

  // Setup drag and drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: `${clipId}-${word.id}`,
    disabled: !isDraggable,
    data: {
      type: 'word',
      wordId: word.id,
      clipId: clipId,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
    position: 'relative' as const,
  }

  // Handle click with double-click detection
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()

      if (isEditing) return // Ignore clicks while editing

      const currentTime = Date.now()
      const timeDiff = currentTime - lastClickTime

      if (timeDiff < 300 && isFocused) {
        // Double-click detected on focused word - open animation sidebar and word detail editor
        setIsAssetSidebarOpen(true)
        expandClip(clipId, word.id)
      } else {
        // Single click - handle selection or start inline edit
        if (!wordRef.current) return
        const rect = wordRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const width = rect.width
        const centerThreshold = width * 0.3
        const isCenter = x > centerThreshold && x < width - centerThreshold

        // If already focused and clicking in center, start inline edit
        if (isFocused && isCenter) {
          startInlineEdit(clipId, word.id)
          setEditingText(word.text)
        } else {
          onWordClick(word.id, isCenter)
        }
      }

      setLastClickTime(currentTime)
    },
    [
      word.id,
      word.text,
      isFocused,
      isEditing,
      lastClickTime,
      clipId,
      onWordClick,
      startInlineEdit,
      setIsAssetSidebarOpen,
      expandClip,
    ]
  )

  // Handle inline editing
  const handleInlineEditSave = useCallback(() => {
    const trimmedText = editingText.trim()
    if (trimmedText && trimmedText !== word.text) {
      onWordEdit(clipId, word.id, trimmedText)
    }
    endInlineEdit()
  }, [editingText, word.text, clipId, word.id, onWordEdit, endInlineEdit])

  const handleInlineEditCancel = useCallback(() => {
    setEditingText(word.text)
    endInlineEdit()
  }, [word.text, endInlineEdit])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleInlineEditCancel()
      }
      // Note: No Enter key handling - only save on blur
    },
    [handleInlineEditCancel]
  )

  // Focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && editableRef.current) {
      editableRef.current.focus()
      // Move cursor to end
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(editableRef.current)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [isEditing])

  // Determine visual state classes
  const getWordClasses = () => {
    const classes = [
      'relative',
      'inline-block',
      'px-2',
      'py-1',
      'text-sm',
      'rounded',
      'transition-all',
      'duration-200',
    ]

    if (!isEditing) {
      classes.push('cursor-pointer', 'select-none')
    }

    if (isEditing) {
      classes.push('bg-yellow-500', 'text-black', 'ring-2', 'ring-yellow-400')
    } else if (isFocused) {
      classes.push('bg-blue-500', 'text-white', 'ring-2', 'ring-blue-400')
    } else if (isInGroup) {
      classes.push('bg-blue-400', 'text-white')
    } else {
      classes.push(
        'bg-[#383842]',
        'border',
        'border-[#4D4D59]',
        'hover:border-[#9999A6]',
        'text-[#F2F2F2]'
      )
    }

    if (isBeingDragged && !isEditing) {
      classes.push('opacity-50', 'cursor-grabbing')
    } else if (isDraggable && !isEditing) {
      classes.push('cursor-grab')
    }

    return classes.join(' ')
  }

  // Drag handlers that work with focus state (disabled during editing)
  const dragListeners =
    isDraggable && !isEditing
      ? {
          ...listeners,
          onMouseDown: (e: React.MouseEvent) => {
            // Allow drag only if word is focused/grouped and not editing
            if (isDraggable && listeners?.onMouseDown) {
              listeners.onMouseDown(e as React.MouseEvent<HTMLElement>)
            }
          },
        }
      : {}

  return (
    <div
      ref={(node) => {
        wordRef.current = node
        if (!isEditing) setNodeRef(node) // Only set drag ref when not editing
      }}
      className={getWordClasses()}
      style={!isEditing ? style : undefined}
      onClick={handleClick}
      data-word-id={word.id}
      data-clip-id={clipId}
      title={
        !isEditing
          ? `${word.text} (${word.start.toFixed(2)}s - ${word.end.toFixed(2)}s)`
          : undefined
      }
      {...(!isEditing ? attributes : {})}
      {...(!isEditing ? dragListeners : {})}
    >
      {/* Drop indicator before word */}
      {isDropTarget && dropPosition === 'before' && !isEditing && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 -translate-x-1 animate-pulse" />
      )}

      {isEditing ? (
        <span
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          className="outline-none min-w-[20px] inline-block"
          onInput={(e) => setEditingText(e.currentTarget.textContent || '')}
          onBlur={handleInlineEditSave}
          onKeyDown={handleKeyDown}
          style={{ minWidth: '1ch' }}
          dangerouslySetInnerHTML={{ __html: editingText }}
        />
      ) : (
        <span>{word.text}</span>
      )}

      {/* Drop indicator after word */}
      {isDropTarget && dropPosition === 'after' && !isEditing && (
        <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-blue-500 translate-x-1 animate-pulse" />
      )}
    </div>
  )
}
