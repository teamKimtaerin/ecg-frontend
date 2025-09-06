'use client'

import React, { useState } from 'react'
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
import { ClipItem } from '@/components/ClipComponent'

export default function EditorPage() {
  // Store state for DnD
  const { activeId } = useEditorStore()
  
  // Local state from main branch
  const [activeTab, setActiveTab] = useState('home')
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const [clips, setClips] = useState<ClipItem[]>([
    {
      id: '1',
      timeline: '0:00:15',
      speaker: 'Speaker 1',
      subtitle: '이제 웹님',
      fullText: '이제 웹님',
      duration: '1.283초',
      thumbnail: '/placeholder-thumb.jpg',
      words: [
        { id: '1-1', text: '이제', start: 15.0, end: 15.5, isEditable: true },
        { id: '1-2', text: '웹님', start: 15.5, end: 16.0, isEditable: true },
      ],
    },
    {
      id: '2',
      timeline: '0:00:24',
      speaker: 'Speaker 2',
      subtitle: '네시요',
      fullText: '네시요',
      duration: '14.683초',
      thumbnail: '/placeholder-thumb.jpg',
      words: [
        { id: '2-1', text: '네시요', start: 24.0, end: 24.8, isEditable: true },
      ],
    },
    {
      id: '3',
      timeline: '0:00:32',
      speaker: 'Speaker 1',
      subtitle: '지금다',
      fullText: '지금다',
      duration: '4.243초',
      thumbnail: '/placeholder-thumb.jpg',
      words: [
        { id: '3-1', text: '지금다', start: 32.0, end: 32.8, isEditable: true },
      ],
    },
    {
      id: '4',
      timeline: '0:00:41',
      speaker: 'Speaker 1',
      subtitle: '이 지금 이는 한 공에',
      fullText: '이 지금 이는 한 공에',
      duration: '6.163초',
      thumbnail: '/placeholder-thumb.jpg',
      words: [
        { id: '4-1', text: '이', start: 41.0, end: 41.2, isEditable: true },
        { id: '4-2', text: '지금', start: 41.2, end: 41.6, isEditable: true },
        { id: '4-3', text: '이는', start: 41.6, end: 41.9, isEditable: true },
        { id: '4-4', text: '한', start: 41.9, end: 42.1, isEditable: true },
        { id: '4-5', text: '공에', start: 42.1, end: 42.5, isEditable: true },
      ],
    },
  ])
  
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

  // Edit handlers from main branch
  const handleWordEdit = (clipId: string, wordId: string, newText: string) => {
    setClips((prevClips) =>
      prevClips.map((clip) =>
        clip.id === clipId
          ? {
              ...clip,
              words: clip.words.map((word) =>
                word.id === wordId ? { ...word, text: newText } : word
              ),
              fullText: clip.words
                .map((word) => (word.id === wordId ? newText : word.text))
                .join(' '),
            }
          : clip
      )
    )
  }

  const handleSpeakerChange = (clipId: string, newSpeaker: string) => {
    setClips((prevClips) =>
      prevClips.map((clip) =>
        clip.id === clipId ? { ...clip, speaker: newSpeaker } : clip
      )
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="min-h-screen bg-gray-900 text-white">
        <EditorHeaderTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        
        <Toolbar activeTab={activeTab} />
        
        <div className="flex h-[calc(100vh-120px)]">
          <VideoSection />
          
          <div 
            className="flex-1 flex justify-center relative"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <SubtitleEditList 
              clips={clips}
              selectedClipId={selectedClipId}
              onClipSelect={setSelectedClipId}
              onWordEdit={handleWordEdit}
              onSpeakerChange={handleSpeakerChange}
            />
            
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