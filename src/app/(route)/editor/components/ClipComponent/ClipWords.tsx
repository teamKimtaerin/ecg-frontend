import {
  IoRefresh,
  IoDocument,
  IoChevronUp,
  IoFlash,
  IoArrowBack,
  IoEye,
  IoExpand,
  IoTrendingUp,
} from 'react-icons/io5'
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

// Asset icon mapping (from feat/editor-asset-sidebar-clean)
const getAssetIcon = (assetName: string) => {
  const iconMap = {
    'Rotation Text': IoRefresh,
    'TypeWriter Effect': IoDocument,
    'Elastic Bounce': IoChevronUp,
    'Glitch Effect': IoFlash,
    'Magnetic Pull': IoArrowBack,
    'Fade In Stagger': IoEye,
    'Scale Pop': IoExpand,
    'Slide Up': IoTrendingUp,
  }
  return iconMap[assetName as keyof typeof iconMap] || null
}

export default function ClipWords({
  clipId,
  words,
  onWordEdit,
}: ClipWordsProps) {
  const {
    // From dev branch
    setFocusedWord,
    clearWordFocus,
    focusedWordId,
    focusedClipId,
    draggedWordId,
    setActiveClipId,
    // From feat/editor-asset-sidebar-clean branch
    selectedWordId,
    setSelectedWordId,
    currentWordAssets,
    setCurrentWordAssets,
    selectedWordAssets,
    applyAssetsToWord,
  } = useEditorStore()

  // Asset related state (from feat/editor-asset-sidebar-clean)
  const [allAssets, setAllAssets] = React.useState<
    Array<{ id: string; title: string }>
  >([])

  // Setup drag and drop for words (from dev)
  const {
    sensors,
    handleWordDragStart,
    handleWordDragOver,
    handleWordDragEnd,
    handleWordDragCancel,
  } = useWordDragAndDrop(clipId)

  // Setup grouping functionality (from dev)
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

  // Fetch assets database for asset names (from feat/editor-asset-sidebar-clean)
  React.useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch('/asset-store/assets-database.json')
        if (response.ok) {
          const data = await response.json()
          setAllAssets(data.assets)
        }
      } catch (error) {
        console.error('Failed to fetch assets:', error)
      }
    }
    fetchAssets()
  }, [])

  // Get asset name by ID (from feat/editor-asset-sidebar-clean)
  const getAssetNameById = (id: string) => {
    const asset = allAssets.find((a) => a.id === id)
    return asset?.title || ''
  }

  // Combined word click handler (merging both functionalities)
  const handleWordClick = useCallback(
    (wordId: string, isCenter: boolean) => {
      const word = words.find((w) => w.id === wordId)
      if (!word) return

      if (isCenter) {
        // Focus the word and its parent clip (from dev)
        setFocusedWord(clipId, wordId)
        setActiveClipId(clipId)

        // Also handle asset selection (from feat/editor-asset-sidebar-clean)
        setSelectedWordId(wordId)
        const wordAssets =
          selectedWordAssets[wordId] || word.appliedAssets || []
        setCurrentWordAssets(wordAssets)
      } else {
        // Focus only the clip component (from dev)
        clearWordFocus()
        setActiveClipId(clipId)

        // Handle asset-related click logic (from feat/editor-asset-sidebar-clean)
        if (selectedWordId === wordId && currentWordAssets.length === 0) {
          onWordEdit(clipId, wordId, word.text)
        } else {
          setSelectedWordId(wordId)
          const wordAssets =
            selectedWordAssets[wordId] || word.appliedAssets || []
          setCurrentWordAssets(wordAssets)
        }
      }
    },
    [
      clipId,
      words,
      setFocusedWord,
      clearWordFocus,
      setActiveClipId,
      selectedWordId,
      setSelectedWordId,
      currentWordAssets,
      setCurrentWordAssets,
      selectedWordAssets,
      onWordEdit,
    ]
  )

  // Create sortable items for DnD (from dev)
  const sortableItems = words.map((word) => `${clipId}-${word.id}`)

  // Find the dragged word for overlay (from dev)
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
          {words.map((word, index) => {
            const isSelected = selectedWordId === word.id
            const appliedAssets = word.appliedAssets || []

            return (
              <React.Fragment key={word.id}>
                <ClipWord
                  word={word}
                  clipId={clipId}
                  onWordClick={handleWordClick}
                  onWordEdit={onWordEdit}
                />

                {/* Render asset icons after each word (from feat/editor-asset-sidebar-clean) */}
                {appliedAssets.length > 0 && (
                  <div className="flex gap-1 items-center">
                    {appliedAssets.map((assetId: string) => {
                      const assetName = getAssetNameById(assetId)
                      const IconComponent = getAssetIcon(assetName)
                      return IconComponent ? (
                        <div
                          key={assetId}
                          className="w-3 h-3 bg-slate-600/50 rounded-sm flex items-center justify-center"
                          title={assetName}
                        >
                          <IconComponent size={10} className="text-slate-300" />
                        </div>
                      ) : null
                    })}
                  </div>
                )}
              </React.Fragment>
            )
          })}

          {/* Visual feedback for group selection (from dev) */}
          {isGroupDragging && (
            <div className="absolute inset-0 bg-blue-500/10 pointer-events-none rounded" />
          )}
        </div>
      </SortableContext>

      {/* Drag overlay for better visual feedback (from dev) */}
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
