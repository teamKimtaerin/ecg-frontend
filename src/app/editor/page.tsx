'use client'

import React from 'react'
import { 
  DndContext, 
  DragOverlay, 
  closestCenter,
  defaultDropAnimationSideEffects 
} from '@dnd-kit/core'

// Store
import { useEditorStore } from './store'

// Hooks
import { useDragAndDrop } from './hooks/useDragAndDrop'
import { useSelectionBox } from './hooks/useSelectionBox'

// Components
import EditorHeaderTabs from './components/EditorHeaderTabs'
import Toolbar from './components/Toolbar'
import VideoSection from './components/VideoSection'
import SubtitleEditList from './components/SubtitleEditList'
import DragOverlayContent from './components/DragOverlayContent'
import SelectionBox from '@/components/SelectionBox'

export default function EditorPage() {
  const { activeId } = useEditorStore()
  
  // DnD functionality
  const { 
    sensors, 
    handleDragStart, 
    handleDragEnd, 
    handleDragCancel 
  } = useDragAndDrop()
  
  // Selection box functionality
  const { 
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isSelecting,
    selectionBox
  } = useSelectionBox()

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="min-h-screen bg-gray-900 text-white">
        <EditorHeaderTabs />
        <Toolbar />
        
        <div className="flex h-[calc(100vh-120px)]">
          <VideoSection />
          
          <div 
            className="flex-1 flex justify-center relative"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <SubtitleEditList />
            
            <SelectionBox
              startX={selectionBox.startX}
              startY={selectionBox.startY}
              endX={selectionBox.endX}
              endY={selectionBox.endY}
              isSelecting={isSelecting}
            />
          </div>
        </div>
      </div>
      
      <DragOverlay 
        dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.3',
              },
            },
          }),
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {activeId && <DragOverlayContent />}
      </DragOverlay>
    </DndContext>
  )
}