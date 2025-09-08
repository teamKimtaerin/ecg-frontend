import React, { useState, useRef, useEffect } from 'react'
import { LuSquareX } from 'react-icons/lu'
import { ChevronDownIcon } from '@/components/icons'
import Dropdown from '@/components/ui/Dropdown'
import { EDITOR_COLORS } from '../../constants/colors'

interface ClipSpeakerProps {
  clipId: string
  speaker: string
  speakers: string[]
  onSpeakerChange?: (clipId: string, newSpeaker: string) => void
  onSpeakerRemove?: (speaker: string) => void
  onBatchSpeakerChange?: (clipIds: string[], newSpeaker: string) => void
}

export default function ClipSpeaker({
  clipId,
  speaker,
  speakers,
  onSpeakerChange,
  onSpeakerRemove,
  onBatchSpeakerChange,
}: ClipSpeakerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredSpeaker, setHoveredSpeaker] = useState<string | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newSpeakerName, setNewSpeakerName] = useState('')
  const [showApplyModal, setShowApplyModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSpeakerSelect = (value: string) => {
    if (!onSpeakerChange) return

    if (value === 'add_new') {
      setIsAddingNew(true)
      setIsOpen(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      onSpeakerChange(clipId, value)
      setIsOpen(false)
    }
  }

  const handleApplyNewSpeaker = () => {
    if (!newSpeakerName.trim()) return

    // 빈 speaker가 있는 클립이 있는지 확인 (모달 표시 여부 결정)
    const hasEmptyClips = !speaker // 현재 클립이 빈 경우만 체크

    if (hasEmptyClips && onBatchSpeakerChange) {
      setShowApplyModal(true)
    } else {
      // 현재 클립에만 적용
      if (onSpeakerChange) {
        onSpeakerChange(clipId, newSpeakerName.trim())
      }
      setIsAddingNew(false)
      setNewSpeakerName('')
    }
  }

  const handleModalChoice = (applyToAll: boolean) => {
    const trimmedName = newSpeakerName.trim()

    if (applyToAll && onBatchSpeakerChange) {
      // 빈 speaker를 가진 모든 클립에 적용
      // EditorPage에서 빈 클립 ID들을 찾아서 전달할 것임
      // 임시로 현재 클립 ID만 전달 (EditorPage에서 처리)
      onBatchSpeakerChange([clipId], trimmedName)
    } else if (onSpeakerChange) {
      // 현재 클립에만 적용
      onSpeakerChange(clipId, trimmedName)
    }

    setShowApplyModal(false)
    setIsAddingNew(false)
    setNewSpeakerName('')
  }

  const handleSpeakerRemove = (
    e: React.MouseEvent,
    speakerToRemove: string
  ) => {
    e.stopPropagation() // 클릭 이벤트 전파 방지
    if (onSpeakerRemove) {
      onSpeakerRemove(speakerToRemove)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* 화자 앞의 동그라미 표시 */}
      <div
        className={`w-2 h-2 rounded-full bg-[${EDITOR_COLORS.clip.accent}] flex-shrink-0`}
      />

      {/* 커스텀 드롭다운 */}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          className="inline-flex items-center justify-between h-8 px-3 text-sm font-medium
                     bg-gray-800 text-gray-300 border border-gray-600 rounded
                     hover:bg-gray-700 hover:border-gray-500 transition-all
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span
            className={`truncate mr-2 ${!speaker ? 'text-orange-400' : ''}`}
          >
            {speaker || 'Speaker 등록 필요'}
          </span>
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* 드롭다운 메뉴 */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full min-w-[150px] rounded bg-gray-800 border border-gray-600 shadow-lg">
            {/* Speaker 옵션들 */}
            {speakers.map((s) => (
              <div
                key={s}
                className="relative px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer
                          transition-colors flex items-center justify-between group"
                onClick={() => handleSpeakerSelect(s)}
                onMouseEnter={() => setHoveredSpeaker(s)}
                onMouseLeave={() => setHoveredSpeaker(null)}
              >
                <span
                  className={speaker === s ? 'text-blue-400 font-medium' : ''}
                >
                  {s}
                </span>
                {/* 호버 시 삭제 버튼 표시 - 오른쪽 위 */}
                {hoveredSpeaker === s && (
                  <button
                    onClick={(e) => handleSpeakerRemove(e, s)}
                    className="absolute -right-1 -top-1 text-gray-400 
                              hover:text-red-500 hover:bg-red-500/20 
                              transition-all duration-200 rounded p-0.5"
                    title={`${s} 삭제`}
                  >
                    <LuSquareX className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {/* 구분선 */}
            <div className="border-t border-gray-700 my-1" />

            {/* 새 Speaker 추가 옵션 */}
            <div
              className="px-3 py-2 text-sm text-blue-400 hover:bg-gray-700 cursor-pointer
                        transition-colors font-medium"
              onClick={() => handleSpeakerSelect('add_new')}
            >
              + Speaker 추가
            </div>
          </div>
        )}
      </div>

      {/* 확장형 입력 UI */}
      {isAddingNew && (
        <div className="flex items-center gap-2 ml-2 animate-slide-right">
          <input
            ref={inputRef}
            type="text"
            value={newSpeakerName}
            onChange={(e) => setNewSpeakerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleApplyNewSpeaker()
              if (e.key === 'Escape') {
                setIsAddingNew(false)
                setNewSpeakerName('')
              }
            }}
            placeholder="Speaker 이름 입력"
            className="h-8 px-3 text-sm bg-gray-800 text-gray-300 border border-gray-600 rounded
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleApplyNewSpeaker}
            disabled={!newSpeakerName.trim()}
            className="h-8 px-4 text-sm font-medium text-white bg-blue-600 rounded
                      hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors"
          >
            적용하기
          </button>
          <button
            onClick={() => {
              setIsAddingNew(false)
              setNewSpeakerName('')
            }}
            className="h-8 px-3 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            취소
          </button>
        </div>
      )}

      {/* 적용 범위 선택 모달 */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              Speaker 적용 범위 선택
            </h3>
            <p className="text-gray-300 mb-6">
              &ldquo;{newSpeakerName}&rdquo;를 어떻게 적용하시겠습니까?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => handleModalChoice(false)}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded
                          hover:bg-gray-600 transition-colors"
              >
                현재 클립만
              </button>
              <button
                onClick={() => handleModalChoice(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded
                          hover:bg-blue-700 transition-colors"
              >
                Speaker가 없는 모든 클립
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
