'use client'

import { FaTimes } from 'react-icons/fa'
import { FaSpinner } from 'react-icons/fa'
import { LuLightbulb, LuChevronDown } from 'react-icons/lu'
import React, { useState, useRef } from 'react'

export interface ProcessingModalProps {
  isOpen: boolean
  onClose: () => void
  onCancel?: () => void
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'select'
  progress: number
  currentStage?: string
  estimatedTimeRemaining?: number
  fileName?: string
  canCancel?: boolean
  backdrop?: boolean
}

const STAGE_MESSAGES = {
  file_validation: '파일 검증 중',
  audio_extraction: '오디오 추출 중',
  whisper_transcription: '음성 인식 중',
  speaker_diarization: '화자 분리 중',
  post_processing: '후처리 중',
} as const

export default function ProcessingModal({
  isOpen,
  onClose,
  onCancel,
  status,
  progress,
  currentStage,
  estimatedTimeRemaining,
  fileName,
  canCancel = true,
  backdrop = true,
}: ProcessingModalProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  const dragStartRef = useRef({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    // 텍스트 선택 등 기본 동작 방지
    e.preventDefault()
    setDragging(true)

    // 현재 마우스 위치에서 모달의 현재 위치를 뺀 값을 저장
    // 이렇게 해야 모달의 어느 곳을 클릭해도 그 위치를 기준으로 이동합니다.
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return

    const newX = e.clientX - dragStartRef.current.x
    const newY = e.clientY - dragStartRef.current.y
    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setDragging(false)
  }

  // 모달 바깥으로 마우스가 나가도 드래그가 풀리도록 이벤트 추가
  const handleMouseLeave = () => {
    if (dragging) {
      setDragging(false)
    }
  }

  const getDynamicTimeText = () => {
    if (!estimatedTimeRemaining) return '음성을 분석하고 있습니다'

    const minutes = Math.ceil(estimatedTimeRemaining / 60)
    if (minutes > 0) {
      return `${minutes}분의 음성을 분석하고 있습니다`
    }
    return '음성을 분석하고 있습니다'
  }

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return '파일을 업로드하고 있습니다'
      case 'processing':
        return getDynamicTimeText()
      case 'completed':
        return '분석이 완료되었습니다'
      case 'failed':
        return '처리 중 오류가 발생했습니다'
      default:
        return '처리를 준비하고 있습니다'
    }
  }

  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return ''
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return mins > 0 ? `${mins}분 ${secs}초` : `${secs}초`
  }

  const shouldShowCloseButton = status === 'completed' || status === 'failed'

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop with blur effect */}
      {backdrop && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm pointer-events-none z-[9998]" />
      )}

      {/* Clean Modal Design */}
      <div
        className="fixed w-[600px] max-w-[90vw] bg-white rounded-2xl shadow-2xl pointer-events-auto z-[9999]"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        role="dialog"
        aria-label="처리 진행 상황"
      >
        {/* Simple Header */}
        <div
          className="flex items-center justify-between p-6 pb-4 cursor-grab"
          onMouseDown={handleMouseDown}
        >
          <h2 className="text-lg font-medium text-gray-900">
            {getStatusText()}
          </h2>
          <button
            onClick={shouldShowCloseButton ? onClose : onCancel}
            onMouseDown={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 pointer-events-auto"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-6">
          {/* File Name with Spinner */}
          {fileName && (
            <div className="flex items-center gap-3 mb-6">
              {(status === 'uploading' || status === 'processing') && (
                <FaSpinner className="animate-spin text-brand-main" size={16} />
              )}
              <span className="text-gray-700 font-medium">{fileName}</span>
            </div>
          )}

          {/* Thumbnail Image */}
          <div className="mb-6 flex justify-center">
            <div className="w-full max-w-md bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center h-48">
              <div className="text-center">
                <div className="text-6xl mb-2">🎬</div>
                <p className="text-sm text-gray-600">처리 중인 비디오</p>
              </div>
            </div>
          </div>

          {/* Tip Section */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg border-l-4 border-brand-sub">
            <div className="flex items-start gap-3">
              <LuLightbulb className="text-brand-main text-lg mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  알고 계셨나요?
                </h4>
                <p className="text-sm text-gray-700 mb-1">
                  편집 중인 영상을 다른 사람에게 보여주고 싶다면,
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">[만일] &gt; [프리뷰 공유]</span>
                  를 사용하여 간편하게 영상을 공유해 보세요.
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">진행률</span>
              <span className="text-sm font-medium text-gray-900">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-main transition-all duration-500 ease-out rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>

          {/* Estimated Time - Only show if available */}
          {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                예상 남은 시간: {formatTime(estimatedTimeRemaining)}
              </p>
            </div>
          )}

          {/* Collapse Arrow */}
          <div className="flex justify-center mt-4">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <LuChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Action Buttons for Completed/Failed States */}
          {status === 'completed' && (
            <div className="flex justify-center mt-6">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-brand-main hover:bg-brand-dark text-white rounded-lg transition-colors"
              >
                에디터로 이동
              </button>
            </div>
          )}

          {status === 'failed' && (
            <div className="flex justify-center mt-6 gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
