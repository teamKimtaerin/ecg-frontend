'use client'

import React, { useState } from 'react'

import Button from '@/components/Button'
import Tab from '@/components/Tab'
import TabItem from '@/components/TabItem'
import ECGPlayer from '@/components/ECGPlayer'

//import VideoPlayer from '@/components/VideoPlayer'
import Dropdown from '@/components/Dropdown'

interface ClipItem {
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

interface EditorHeaderTabsProps {
  activeTab: string
  onTabChange: (tabId: string) => void
}

function EditorHeaderTabs({ activeTab, onTabChange }: EditorHeaderTabsProps) {
  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-600/40 relative">
      <div className="flex items-center px-6 py-2">
        <Tab
          selectedItem={activeTab}
          onSelectionChange={onTabChange}
          size="small"
          isQuiet={true}
          className="flex-1"
        >
          <TabItem id="file" label="파일" />
          <TabItem id="home" label="홈" />
          <TabItem id="edit" label="편집" />
          <TabItem id="subtitle" label="자막" />
          <TabItem id="format" label="서식" />
          <TabItem id="insert" label="삽입" />
          <TabItem id="template" label="템플릿" />
          <TabItem id="effect" label="효과" />
        </Tab>

        <Button
          variant="accent"
          size="small"
          className="ml-4 px-3 py-1.5 text-xs bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm hover:shadow-md transition-all duration-200 hover:from-blue-600 hover:to-indigo-700"
        >
          내보내기
        </Button>
      </div>
    </div>
  )
}

interface ToolbarProps {
  activeTab: string
}

function Toolbar({ activeTab }: ToolbarProps) {
  const renderHomeTools = () => (
    <div className="flex items-center space-x-2">
      <Button size="small" variant="secondary" className="text-xs">
        새로 만들기
      </Button>
      <Button size="small" variant="secondary" className="text-xs">
        프로젝트 열기
      </Button>
      <div className="w-px h-6 bg-slate-600 mx-2" />
      <Button size="small" variant="secondary" className="text-xs px-2">
        ↶
      </Button>
      <Button size="small" variant="secondary" className="text-xs px-2">
        ↷
      </Button>
      <div className="w-px h-6 bg-slate-600 mx-2" />
      <Button size="small" variant="secondary" className="text-xs">
        잘라내기
      </Button>
      <Button size="small" variant="secondary" className="text-xs">
        복사하기
      </Button>
      <Button size="small" variant="secondary" className="text-xs">
        붙여넣기
      </Button>
      <div className="w-px h-6 bg-slate-600 mx-2" />
      <Button size="small" variant="secondary" className="text-xs">
        클립 합치기
      </Button>
      <Button size="small" variant="secondary" className="text-xs">
        클립 나누기
      </Button>
      <div className="w-px h-6 bg-slate-600 mx-2" />
      <Button size="small" variant="secondary" className="text-xs">
        기본 자막 텍스트 서식 수정
      </Button>
    </div>
  )

  const renderToolsForTab = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeTools()
      case 'file':
        return (
          <div className="flex items-center space-x-2">
            <Button size="small" variant="secondary" className="text-xs">
              파일 열기
            </Button>
            <Button size="small" variant="secondary" className="text-xs">
              저장
            </Button>
            <Button size="small" variant="secondary" className="text-xs">
              다른 이름으로 저장
            </Button>
          </div>
        )
      case 'edit':
        return (
          <div className="flex items-center space-x-2">
            <Button size="small" variant="secondary" className="text-xs">
              분할
            </Button>
            <Button size="small" variant="secondary" className="text-xs">
              병합
            </Button>
            <Button size="small" variant="secondary" className="text-xs">
              삭제
            </Button>
          </div>
        )
      case 'subtitle':
        return (
          <div className="flex items-center space-x-2">
            <Button size="small" variant="secondary" className="text-xs">
              자막 추가
            </Button>
            <Button size="small" variant="secondary" className="text-xs">
              자막 삭제
            </Button>
            <Button size="small" variant="secondary" className="text-xs">
              타이밍 조정
            </Button>
          </div>
        )
      default:
        return <div className="text-xs text-slate-400">도구 없음</div>
    }
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border-b border-slate-600/30 px-6 py-3">
      {renderToolsForTab()}
    </div>
  )
}

// function VideoSection() {
//   return (
//     <div className="w-[300px] bg-gray-900 p-4 border-r border-gray-700">
//       <div
//         className="bg-black rounded-lg mb-4 relative"
//         style={{ aspectRatio: '16/9' }}
//       >
//         <VideoPlayer className="w-full h-full" />
//       </div>
//     </div>
//   )
// }

interface ClipProps {
  clip: ClipItem
  isSelected: boolean
  onSelect: (clipId: string) => void
  onWordEdit: (clipId: string, wordId: string, newText: string) => void
}

function ClipComponent({ clip, isSelected, onSelect, onWordEdit }: ClipProps) {
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
                    { value: 'Speaker 1', label: 'Speaker 1' },
                    { value: 'Speaker 2', label: 'Speaker 2' },
                    { value: 'Speaker 3', label: 'Speaker 3' },
                  ]}
                  size="small"
                  className="text-sm flex-shrink-0"
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

interface ClipTableProps {
  clips: ClipItem[]
  selectedClipId: string | null
  onClipSelect: (clipId: string) => void
  onWordEdit: (clipId: string, wordId: string, newText: string) => void
}

function SubtitleEditList({
  clips,
  selectedClipId,
  onClipSelect,
  onWordEdit,
}: ClipTableProps) {
  return (
    <div className="w-[800px] bg-gray-900 p-4">
      <div className="space-y-3">
        {clips.map((clip) => (
          <ClipComponent
            key={clip.id}
            clip={clip}
            isSelected={selectedClipId === clip.id}
            onSelect={onClipSelect}
            onWordEdit={onWordEdit}
          />
        ))}
      </div>
    </div>
  )
}


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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <EditorHeaderTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <Toolbar activeTab={activeTab} />

        {/* Central Video Player */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-[80px] w-[960px] h-[540px]">
          <ECGPlayer />
        </div>


        <div className="flex-1 flex justify-center">
          <SubtitleEditList
            clips={clips}
            selectedClipId={selectedClipId}
            onClipSelect={setSelectedClipId}
            onWordEdit={handleWordEdit}
          />
        </div>
      </div>
    </div>
  )
}
