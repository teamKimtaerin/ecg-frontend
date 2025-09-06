'use client'

import React from 'react'
import Dropdown from '@/components/Dropdown'

export interface ClipItem {
  id: string
  timeline: string
  speaker: string
  subtitle: string
  fullText: string
  duration: string
  thumbnail: string
  words: Array<{
    id: string
    text: string
    start: number
    end: number
    isEditable: boolean
    confidence?: number
  }>
}

export interface ClipComponentProps {
  clip: ClipItem
  isSelected: boolean
  onSelect: (clipId: string) => void
  onWordEdit: (clipId: string, wordId: string, newText: string) => void
  onSpeakerChange?: (clipId: string, newSpeaker: string) => void
}

const ClipComponent: React.FC<ClipComponentProps> = ({
  clip,
  isSelected,
  onSelect,
  onWordEdit,
  onSpeakerChange,
}) => {
  const [speakers] = React.useState(['Speaker 1', 'Speaker 2', 'Speaker 3'])

  const handleSpeakerChange = (value: string) => {
    if (value === 'add_new') {
      const newSpeaker = prompt('새 Speaker 이름을 입력하세요:')
      if (newSpeaker && newSpeaker.trim()) {
        onSpeakerChange?.(clip.id, newSpeaker.trim())
      }
    } else {
      onSpeakerChange?.(clip.id, value)
    }
  }
  return (
    <div
      className={`bg-gray-200 rounded-lg transition-all cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:bg-gray-300'
      }`}
      onClick={() => onSelect(clip.id)}
    >
      <div className="flex">
        {/* Left side: Timeline - spans full height */}
        <div className="w-16 flex flex-col bg-gray-300 rounded-l-lg border-r border-gray-400">
          <div className="flex-1 flex items-center justify-center py-3">
            <span className="text-xs text-gray-600 font-mono">
              {clip.timeline}
            </span>
          </div>
        </div>

        {/* Right side content */}
        <div className="flex-1 flex flex-col">
          {/* Upper section: Speaker and Word buttons */}
          <div className="p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center flex-1 pl-4">
                <Dropdown
                  value={clip.speaker}
                  options={[
                    ...speakers.map((speaker) => ({
                      value: speaker,
                      label: speaker,
                    })),
                    { value: 'add_new', label: '+ 새 Speaker 추가' },
                  ]}
                  size="small"
                  className="text-sm flex-shrink-0"
                  onChange={handleSpeakerChange}
                />

                {/* 50px gap before word buttons */}
                <div className="w-12"></div>

                {/* Word buttons */}
                <div className="flex flex-wrap gap-1">
                  {clip.words.map((word) => (
                    <button
                      key={word.id}
                      className="bg-white border border-gray-300 hover:border-gray-400 rounded px-2 py-1 text-sm text-gray-800 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        onWordEdit(clip.id, word.id, word.text)
                      }}
                    >
                      {word.text}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-1 flex-shrink-0">
                <button className="w-6 h-6 bg-gray-400 hover:bg-gray-500 rounded flex items-center justify-center text-xs text-white transition-colors">
                  ▶
                </button>
                <button className="w-6 h-6 bg-gray-400 hover:bg-gray-500 rounded flex items-center justify-center text-xs text-white transition-colors">
                  ⏸
                </button>
                <button className="w-6 h-6 bg-gray-400 hover:bg-gray-500 rounded flex items-center justify-center text-xs text-white transition-colors">
                  ⏹
                </button>
              </div>
            </div>
          </div>

          {/* Divider line - only in right section */}
          <div className="border-t border-gray-400"></div>

          {/* Lower section: Full text display */}
          <div className="p-3">
            <div className="text-sm text-gray-800 text-center">
              {clip.fullText}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClipComponent
