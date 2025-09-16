import React, { useState, useRef, useEffect } from 'react'
import { LuX, LuPlus, LuTrash2, LuUserX, LuArrowRight } from 'react-icons/lu'

interface ClipItem {
  id: string
  timeline: string
  speaker: string
  fullText: string
}

interface SpeakerManagementSidebarProps {
  isOpen: boolean
  onClose: () => void
  speakers: string[]
  clips: ClipItem[]
  onAddSpeaker: (name: string) => void
  onRemoveSpeaker: (name: string) => void
  onRenameSpeaker: (oldName: string, newName: string) => void
  onBatchSpeakerChange: (clipIds: string[], newSpeaker: string) => void
}

export default function SpeakerManagementSidebar({
  isOpen,
  onClose,
  speakers,
  clips,
  onAddSpeaker,
  onRemoveSpeaker,
  onRenameSpeaker,
  onBatchSpeakerChange,
}: SpeakerManagementSidebarProps) {
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [selectedUnassignedClips, setSelectedUnassignedClips] = useState<
    Set<string>
  >(new Set())
  const [showUnassignedPanel, setShowUnassignedPanel] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 미지정 클립들 필터링
  const unassignedClips = clips.filter(
    (clip) => !clip.speaker || clip.speaker.trim() === ''
  )

  // 미지정 클립 선택/해제 핸들러
  const handleUnassignedClipToggle = (clipId: string) => {
    const newSelected = new Set(selectedUnassignedClips)
    if (newSelected.has(clipId)) {
      newSelected.delete(clipId)
    } else {
      newSelected.add(clipId)
    }
    setSelectedUnassignedClips(newSelected)
  }

  // 전체 선택/해제
  const handleSelectAllUnassigned = () => {
    if (selectedUnassignedClips.size === unassignedClips.length) {
      setSelectedUnassignedClips(new Set())
    } else {
      setSelectedUnassignedClips(
        new Set(unassignedClips.map((clip) => clip.id))
      )
    }
  }

  // 선택된 미지정 클립들에 화자 일괄 적용
  const handleAssignSpeakerToSelected = (speakerName: string) => {
    if (selectedUnassignedClips.size > 0) {
      onBatchSpeakerChange(Array.from(selectedUnassignedClips), speakerName)
      setSelectedUnassignedClips(new Set())
    }
  }

  useEffect(() => {
    if (editingSpeaker && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingSpeaker])

  const handleAddSpeaker = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation() // 이벤트 전파 방지

    // 최대 화자 수 제한 체크 (9명)
    if (speakers.length >= 9) {
      alert('최대 9명의 화자까지만 추가할 수 있습니다.')
      return
    }

    // 현재 존재하는 화자 번호들을 추출
    const existingNumbers = speakers
      .map((speaker) => {
        const match = speaker.match(/^화자(\d+)$/)
        return match ? parseInt(match[1], 10) : 0
      })
      .filter((num) => num > 0)

    // 가장 작은 빈 번호 찾기 (1부터 시작)
    let nextNumber = 1
    while (existingNumbers.includes(nextNumber)) {
      nextNumber++
    }

    const newSpeakerName = `화자${nextNumber}`
    console.log('Adding speaker:', newSpeakerName)
    console.log('Current speakers:', speakers)
    console.log('Existing numbers:', existingNumbers)

    onAddSpeaker(newSpeakerName)
  }

  const handleStartEdit = (speaker: string) => {
    setEditingSpeaker(speaker)
    setEditingName(speaker)
  }

  const handleSaveEdit = () => {
    const trimmedName = editingName.trim()
    if (!trimmedName || !editingSpeaker) return

    // 중복 체크 (자기 자신은 제외)
    if (trimmedName !== editingSpeaker && speakers.includes(trimmedName)) {
      alert('이미 존재하는 화자명입니다.')
      return
    }

    console.log('Renaming speaker:', editingSpeaker, '->', trimmedName)
    onRenameSpeaker(editingSpeaker, trimmedName)
    setEditingSpeaker(null)
    setEditingName('')
  }

  const handleCancelEdit = () => {
    setEditingSpeaker(null)
    setEditingName('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const getSpeakerColor = (index: number) => {
    const colors = [
      'bg-cyan-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-blue-500',
      'bg-red-500',
    ]
    return colors[index % colors.length]
  }

  if (!isOpen) return null

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-white">화자 관리</h2>
          <p className="text-sm text-gray-400 mt-1">
            {speakers.length}/9명
            {speakers.length >= 9 && (
              <span className="text-yellow-400 ml-1">(최대)</span>
            )}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white transition-colors"
        >
          <LuX className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 overflow-y-auto flex-1">
        {/* 미지정 클립 관리 패널 */}
        {unassignedClips.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <LuUserX className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-semibold text-white">
                  미지정 클립 ({unassignedClips.length}개)
                </h3>
              </div>
              <button
                onClick={() => setShowUnassignedPanel(!showUnassignedPanel)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <LuArrowRight
                  className={`w-4 h-4 transition-transform ${showUnassignedPanel ? 'rotate-90' : ''}`}
                />
              </button>
            </div>

            {showUnassignedPanel && (
              <div className="space-y-3">
                {/* 전체 선택 체크박스 */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        selectedUnassignedClips.size ===
                          unassignedClips.length && unassignedClips.length > 0
                      }
                      onChange={handleSelectAllUnassigned}
                      className="w-4 h-4 rounded"
                    />
                    전체 선택
                  </label>
                  <span className="text-gray-400">
                    {selectedUnassignedClips.size}개 선택됨
                  </span>
                </div>

                {/* 클립 리스트 */}
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {unassignedClips.map((clip) => (
                    <label
                      key={clip.id}
                      className="flex items-start gap-2 p-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUnassignedClips.has(clip.id)}
                        onChange={() => handleUnassignedClipToggle(clip.id)}
                        className="w-4 h-4 rounded mt-0.5 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-gray-400 mb-1">
                          {clip.timeline}
                        </div>
                        <div className="text-sm text-gray-300 truncate">
                          {clip.fullText}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* 화자 할당 버튼들 */}
                {selectedUnassignedClips.size > 0 && (
                  <div className="border-t border-gray-700 pt-3">
                    <div className="text-xs text-gray-400 mb-2">
                      선택된 클립에 화자 할당:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {speakers.map((speaker) => (
                        <button
                          key={speaker}
                          onClick={() => handleAssignSpeakerToSelected(speaker)}
                          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                        >
                          {speaker}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Speaker List */}
        <div className="space-y-3">
          {speakers.map((speaker, index) => (
            <div
              key={speaker}
              className="flex items-center justify-between p-3 bg-gray-800 rounded-lg min-h-[52px]"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div
                  className={`w-4 h-4 rounded-full flex-shrink-0 ${getSpeakerColor(index)}`}
                />
                {editingSpeaker === speaker ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSaveEdit}
                    className="flex-1 bg-transparent text-white font-medium border-b border-cyan-500 outline-none min-w-0 truncate"
                    style={{ maxWidth: 'calc(100% - 60px)' }}
                  />
                ) : (
                  <span
                    className="text-white font-medium cursor-pointer hover:text-cyan-400 transition-colors flex-1 truncate overflow-hidden whitespace-nowrap"
                    onClick={() => handleStartEdit(speaker)}
                    style={{ maxWidth: 'calc(100% - 60px)' }}
                  >
                    {speaker}
                  </span>
                )}
              </div>
              {editingSpeaker !== speaker && (
                <button
                  onClick={() => onRemoveSpeaker(speaker)}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                  title="삭제"
                >
                  <LuTrash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {speakers.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              등록된 화자가 없습니다
            </div>
          )}

          {/* Add Speaker */}
          <button
            onClick={handleAddSpeaker}
            disabled={speakers.length >= 9}
            className={`w-full p-3 border-2 border-dashed rounded-lg
                        transition-all flex items-center justify-center space-x-2
                        ${
                          speakers.length >= 9
                            ? 'border-gray-700 text-gray-500 cursor-not-allowed'
                            : 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
                        }`}
            title={
              speakers.length >= 9
                ? '최대 9명의 화자까지만 추가할 수 있습니다.'
                : '화자 추가하기'
            }
          >
            <LuPlus className="w-5 h-5" />
            <span>
              {speakers.length >= 9 ? '화자 추가 제한 (9/9)' : '화자 추가하기'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
