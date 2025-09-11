import React, { useState, useRef, useEffect } from 'react'
import {
  LuX,
  LuPlus,
  LuTrash2,
  LuUserX,
  LuArrowRight,
  LuPalette,
} from 'react-icons/lu'
import chroma from 'chroma-js'
import { getSpeakerColor } from '@/utils/editor/speakerColors'

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
  speakerColors?: Record<string, string>
  onAddSpeaker: (name: string) => void
  onRemoveSpeaker: (name: string) => void
  onRenameSpeaker: (oldName: string, newName: string) => void
  onBatchSpeakerChange: (clipIds: string[], newSpeaker: string) => void
  onSpeakerColorChange?: (speakerName: string, color: string) => void
}

export default function SpeakerManagementSidebar({
  isOpen,
  onClose,
  speakers,
  clips,
  speakerColors = {},
  onAddSpeaker,
  onRemoveSpeaker,
  onRenameSpeaker,
  onBatchSpeakerChange,
  onSpeakerColorChange,
}: SpeakerManagementSidebarProps) {
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [selectedUnassignedClips, setSelectedUnassignedClips] = useState<
    Set<string>
  >(new Set())
  const [showUnassignedPanel, setShowUnassignedPanel] = useState(false)
  const [selectedColorSpeaker, setSelectedColorSpeaker] = useState<
    string | null
  >(null)
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

  // 색상환을 위한 HSV 색상 생성
  const generateColorWheel = () => {
    const colors = []
    const saturation = 0.8
    const value = 0.9

    // 12개 색상으로 색상환 생성 (30도씩)
    for (let i = 0; i < 12; i++) {
      const hue = (i * 30) % 360
      const chromaColor = chroma.hsv(hue, saturation, value)
      colors.push({
        color: chromaColor.hex(),
        name: `Hue ${hue}°`,
        hue,
        angle: i * 30 - 90, // -90도로 조정하여 빨간색이 위에 오도록
      })
    }

    return colors
  }

  const colorWheelColors = generateColorWheel()

  // 색상환 중앙의 원 위치 계산
  const getColorPosition = (angle: number, radius: number) => {
    const radian = (angle * Math.PI) / 180
    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
    }
  }

  const handleColorSelect = (colorHex: string) => {
    if (!selectedColorSpeaker || !onSpeakerColorChange) return

    // 현재 선택한 화자가 이미 이 색상을 사용 중인지 확인
    if (speakerColors[selectedColorSpeaker] === colorHex) {
      setSelectedColorSpeaker(null)
      return
    }

    // 다른 화자가 이미 이 색상을 사용 중인지 확인
    const isColorInUse = Object.entries(speakerColors).some(
      ([speaker, color]) =>
        speaker !== selectedColorSpeaker && color === colorHex
    )

    if (isColorInUse) {
      alert('이미 다른 화자가 사용 중인 색상입니다.')
      return
    }

    onSpeakerColorChange(selectedColorSpeaker, colorHex)
    setSelectedColorSpeaker(null)
  }

  if (!isOpen) return null

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-black">화자 관리</h2>
          <p className="text-sm text-gray-600 mt-1">
            {speakers.length}/9명
            {speakers.length >= 9 && (
              <span className="text-yellow-400 ml-1">(최대)</span>
            )}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-600 hover:text-black transition-colors"
        >
          <LuX className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 overflow-y-auto flex-1">
        {/* 미지정 클립 관리 패널 */}
        {unassignedClips.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <LuUserX className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-semibold text-black">
                  미지정 클립 ({unassignedClips.length}개)
                </h3>
              </div>
              <button
                onClick={() => setShowUnassignedPanel(!showUnassignedPanel)}
                className="text-gray-600 hover:text-black transition-colors"
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
                  <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
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
                  <span className="text-gray-600">
                    {selectedUnassignedClips.size}개 선택됨
                  </span>
                </div>

                {/* 클립 리스트 */}
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {unassignedClips.map((clip) => (
                    <label
                      key={clip.id}
                      className="flex items-start gap-2 p-2 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUnassignedClips.has(clip.id)}
                        onChange={() => handleUnassignedClipToggle(clip.id)}
                        className="w-4 h-4 rounded mt-0.5 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-gray-600 mb-1">
                          {clip.timeline}
                        </div>
                        <div className="text-sm text-gray-700 truncate">
                          {clip.fullText}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* 화자 할당 버튼들 */}
                {selectedUnassignedClips.size > 0 && (
                  <div className="border-t border-gray-700 pt-3">
                    <div className="text-xs text-gray-600 mb-2">
                      선택된 클립에 화자 할당:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {speakers.map((speaker) => (
                        <button
                          key={speaker}
                          onClick={() => handleAssignSpeakerToSelected(speaker)}
                          className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
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
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg min-h-[52px] border border-gray-200"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-300"
                  style={{
                    backgroundColor: getSpeakerColor(speaker, speakerColors),
                  }}
                  onClick={() =>
                    setSelectedColorSpeaker(
                      selectedColorSpeaker === speaker ? null : speaker
                    )
                  }
                  title="색상 변경"
                />
                {editingSpeaker === speaker ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSaveEdit}
                    className="flex-1 bg-transparent text-black font-medium border-b border-cyan-500 outline-none min-w-0 truncate"
                    style={{ maxWidth: 'calc(100% - 60px)' }}
                  />
                ) : (
                  <span
                    className="text-black font-medium cursor-pointer hover:text-cyan-400 transition-colors flex-1 truncate overflow-hidden whitespace-nowrap"
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
                  className="p-1 text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                  title="삭제"
                >
                  <LuTrash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {speakers.length === 0 && (
            <div className="text-center py-8 text-gray-600">
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
                            : 'border-gray-600 text-gray-600 hover:text-black hover:border-gray-500'
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

        {/* 색상 변경 섹션 */}
        {selectedColorSpeaker && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LuPalette className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-black">
                  {selectedColorSpeaker} 색상 변경
                </h3>
              </div>
              <button
                onClick={() => setSelectedColorSpeaker(null)}
                className="p-1 text-gray-600 hover:text-black transition-colors"
              >
                <LuX className="w-4 h-4" />
              </button>
            </div>

            {/* 색상환 */}
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-3">
                {/* 색상환 배경 그라디언트 */}
                <div
                  className="absolute inset-2 rounded-full"
                  style={{
                    background: `conic-gradient(
                      hsl(0, 80%, 90%),
                      hsl(30, 80%, 90%), 
                      hsl(60, 80%, 90%),
                      hsl(90, 80%, 90%),
                      hsl(120, 80%, 90%),
                      hsl(150, 80%, 90%),
                      hsl(180, 80%, 90%),
                      hsl(210, 80%, 90%),
                      hsl(240, 80%, 90%),
                      hsl(270, 80%, 90%),
                      hsl(300, 80%, 90%),
                      hsl(330, 80%, 90%),
                      hsl(360, 80%, 90%)
                    )`,
                  }}
                />

                {/* 색상 점들 */}
                {colorWheelColors.map((colorData, index) => {
                  const radius = 50 // 색상환 반지름 (작은 사이즈)
                  const position = getColorPosition(colorData.angle, radius)

                  // 이 색상이 현재 사용 중인지 확인
                  const isCurrentSpeakerColor =
                    speakerColors[selectedColorSpeaker] === colorData.color
                  const isUsedByOtherSpeaker = Object.entries(
                    speakerColors
                  ).some(
                    ([speaker, color]) =>
                      speaker !== selectedColorSpeaker &&
                      color === colorData.color
                  )

                  return (
                    <div
                      key={`${colorData.color}-${index}`}
                      className={`absolute w-4 h-4 rounded-full cursor-pointer border transition-all shadow-md hover:shadow-lg hover:scale-110 ${
                        isCurrentSpeakerColor
                          ? 'border-white ring-2 ring-blue-500 scale-125'
                          : isUsedByOtherSpeaker
                            ? 'border-white opacity-50 cursor-not-allowed'
                            : 'border-white hover:border-gray-200'
                      }`}
                      style={{
                        backgroundColor: colorData.color,
                        left: `calc(50% + ${position.x}px - 8px)`,
                        top: `calc(50% + ${position.y}px - 8px)`,
                      }}
                      onClick={() =>
                        !isUsedByOtherSpeaker &&
                        handleColorSelect(colorData.color)
                      }
                      title={`${colorData.name}\nHex: ${colorData.color}${
                        isCurrentSpeakerColor
                          ? '\n(현재 선택됨)'
                          : isUsedByOtherSpeaker
                            ? '\n(사용 중)'
                            : ''
                      }`}
                    >
                      {/* 사용 중인 색상에 X 표시 */}
                      {isUsedByOtherSpeaker && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="w-2 h-2 text-white drop-shadow-lg"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                      {/* 현재 선택된 색상에 체크 표시 */}
                      {isCurrentSpeakerColor && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="w-2 h-2 text-white drop-shadow-lg"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* 중앙 원 */}
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center">
                  <div className="text-xs text-gray-600 text-center font-medium">
                    색상
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-600 text-center">
                색상을 선택하여 {selectedColorSpeaker}의 색상을 변경하세요
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
