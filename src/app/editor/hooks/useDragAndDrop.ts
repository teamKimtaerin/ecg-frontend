import { useCallback } from 'react'
import {
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useEditorStore } from '../store'
import { DRAG_ACTIVATION_DISTANCE } from '../types'

export function useDragAndDrop() {
  const { selectedClipIds, setSelectedClipIds, setActiveId, reorderClips } =
    useEditorStore()

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: DRAG_ACTIVATION_DISTANCE,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      setActiveId(active.id as string)

      // If dragging an item that's not selected, clear selection and select only this item
      if (!selectedClipIds.has(active.id as string)) {
        setSelectedClipIds(new Set([active.id as string]))
      }
    },
    [selectedClipIds, setActiveId, setSelectedClipIds]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (active.id !== over?.id && over) {
        reorderClips(active.id as string, over.id as string, selectedClipIds)
      }

      setActiveId(null)
    },
    [selectedClipIds, reorderClips, setActiveId]
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [setActiveId])

  return {
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  }
}
