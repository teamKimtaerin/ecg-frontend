import { useCallback, useRef } from 'react'
import {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useEditorStore } from '../store'

export function useWordDragAndDrop(clipId: string) {
  const {
    focusedWordId,
    focusedClipId,
    groupedWordIds,
    startWordDrag,
    endWordDrag,
    setDropTarget,
    clearWordFocus,
    setFocusedWord,
  } = useEditorStore()

  const draggedWordsRef = useRef<Set<string>>(new Set())

  // Configure sensors for drag activation
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Small distance for word dragging
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  )

  const handleWordDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      const data = active.data.current

      if (data?.type !== 'word') return

      const wordId = data.wordId as string
      const dragClipId = data.clipId as string

      // Only allow drag if word is focused or in group
      if (
        (focusedWordId === wordId && focusedClipId === dragClipId) ||
        groupedWordIds.has(wordId)
      ) {
        startWordDrag(wordId)

        // If dragging a grouped word, track all grouped words
        if (groupedWordIds.size > 1) {
          draggedWordsRef.current = new Set(groupedWordIds)
        } else {
          draggedWordsRef.current = new Set([wordId])
        }
      }
    },
    [focusedWordId, focusedClipId, groupedWordIds, startWordDrag]
  )

  const handleWordDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      const activeData = active.data.current
      const overData = over?.data.current

      if (activeData?.type !== 'word') return

      if (over && overData?.type === 'word') {
        const overWordId = overData.wordId as string
        const overClipId = overData.clipId as string

        // Only allow dropping within the same clip
        if (overClipId === clipId) {
          // Calculate drop position based on cursor location
          const activeRect = active.rect.current.translated
          const overRect = over.rect

          if (activeRect && overRect) {
            const position =
              activeRect.left < overRect.left + overRect.width / 2
                ? 'before'
                : 'after'
            setDropTarget(overWordId, position)
          }
        }
      } else {
        setDropTarget(null, null)
      }
    },
    [clipId, setDropTarget]
  )

  const handleWordDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      const activeData = active.data.current
      const overData = over?.data.current

      endWordDrag()
      draggedWordsRef.current.clear()

      if (
        activeData?.type === 'word' &&
        over &&
        overData?.type === 'word' &&
        active.id !== over.id
      ) {
        const sourceWordId = activeData.wordId as string
        const targetWordId = overData.wordId as string
        const sourceClipId = activeData.clipId as string
        const targetClipId = overData.clipId as string

        // Only reorder if within same clip
        if (sourceClipId === targetClipId && sourceClipId === clipId) {
          // This will trigger the actual reordering in the store
          const { reorderWordsInClip } = useEditorStore.getState()
          if (reorderWordsInClip) {
            reorderWordsInClip(clipId, sourceWordId, targetWordId)
          }
        }
      }
    },
    [clipId, endWordDrag]
  )

  const handleWordDragCancel = useCallback(() => {
    endWordDrag()
    draggedWordsRef.current.clear()
  }, [endWordDrag])

  return {
    sensors,
    handleWordDragStart,
    handleWordDragOver,
    handleWordDragEnd,
    handleWordDragCancel,
    draggedWords: draggedWordsRef.current,
  }
}
