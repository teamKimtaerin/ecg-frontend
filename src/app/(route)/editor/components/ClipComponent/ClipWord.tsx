import React, { useRef, useCallback, useState, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Word } from './types'
import { useEditorStore } from '../../store'

interface ClipWordProps {
  word: Word
  clipId: string
  index: number
  onWordClick: (wordId: string, isCenter: boolean) => void
  onWordEdit: (clipId: string, wordId: string, newText: string) => void
}

export default function ClipWord({
  word,
  clipId,
  index,
  onWordClick,
  onWordEdit,
}: ClipWordProps) {
  const wordRef = useRef<HTMLButtonElement>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const {
    focusedWordId,
    focusedClipId,
    groupedWordIds,
    isDraggingWord,
    draggedWordId,
    dropTargetWordId,
    dropPosition,
    canDragWord,
  } = useEditorStore()

  const isFocused = focusedWordId === word.id && focusedClipId === clipId
  const isInGroup = groupedWordIds.has(word.id)
  const isDraggable = canDragWord(word.id)
  const isBeingDragged = draggedWordId === word.id
  const isDropTarget = dropTargetWordId === word.id

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

  // Handle click with center detection
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()

      if (!wordRef.current) return

      const rect = wordRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const width = rect.width
      const centerThreshold = width * 0.3 // 30% from each edge is considered center

      const isCenter = x > centerThreshold && x < width - centerThreshold

      if (isCenter && isFocused) {
        // Open edit dialog if clicking center of focused word
        setIsEditDialogOpen(true)
      } else {
        onWordClick(word.id, isCenter)
      }
    },
    [word.id, isFocused, onWordClick]
  )

  // Handle edit dialog
  const handleEditSubmit = (newText: string) => {
    onWordEdit(clipId, word.id, newText)
    setIsEditDialogOpen(false)
  }

  // Determine visual state classes
  const getWordClasses = () => {
    const classes = [
      'relative',
      'px-2',
      'py-1',
      'text-sm',
      'rounded',
      'transition-all',
      'duration-200',
      'cursor-pointer',
      'select-none',
    ]

    if (isFocused) {
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

    if (isBeingDragged) {
      classes.push('opacity-50', 'cursor-grabbing')
    } else if (isDraggable) {
      classes.push('cursor-grab')
    }

    return classes.join(' ')
  }

  // Drag handlers that work with focus state
  const dragListeners = isDraggable
    ? {
        ...listeners,
        onMouseDown: (e: React.MouseEvent) => {
          // Allow drag only if word is focused/grouped
          if (isDraggable && listeners?.onMouseDown) {
            listeners.onMouseDown(e as React.MouseEvent<HTMLButtonElement>)
          }
        },
      }
    : {}

  return (
    <>
      <button
        ref={(node) => {
          wordRef.current = node
          setNodeRef(node)
        }}
        className={getWordClasses()}
        style={style}
        onClick={handleClick}
        data-word-id={word.id}
        data-clip-id={clipId}
        title={`${word.text} (${word.start.toFixed(2)}s - ${word.end.toFixed(2)}s)`}
        {...attributes}
        {...dragListeners}
      >
        {/* Drop indicator before word */}
        {isDropTarget && dropPosition === 'before' && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 -translate-x-1 animate-pulse" />
        )}

        {word.text}

        {/* Drop indicator after word */}
        {isDropTarget && dropPosition === 'after' && (
          <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-blue-500 translate-x-1 animate-pulse" />
        )}
      </button>

      {/* Edit dialog */}
      {isEditDialogOpen && (
        <EditWordDialog
          word={word}
          onSubmit={handleEditSubmit}
          onClose={() => setIsEditDialogOpen(false)}
        />
      )}
    </>
  )
}

// Simple edit dialog component
function EditWordDialog({
  word,
  onSubmit,
  onClose,
}: {
  word: Word
  onSubmit: (text: string) => void
  onClose: () => void
}) {
  const [editText, setEditText] = useState(word.text)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editText.trim()) {
      onSubmit(editText.trim())
    }
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <form
        className="bg-[#2A2A33] p-4 rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-[#383842] text-[#F2F2F2] px-3 py-2 rounded border border-[#4D4D59] focus:border-[#9999A6] focus:outline-none"
        />
        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[#383842] text-[#F2F2F2] rounded hover:bg-[#4D4D59]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
