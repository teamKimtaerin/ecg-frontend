'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useEditorStore } from '../../store'
import type { TextStyle, TextAnimation } from '../../types/textInsertion'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'
import ColorPicker from '@/components/ui/ColorPicker'
import Slider from '@/components/ui/Slider'

interface TextInputModalProps {
  isOpen: boolean
  textId: string | null
  onClose: () => void
  onSave: () => void
}

const FONT_FAMILIES = [
  'Arial, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Helvetica, sans-serif',
  'Verdana, sans-serif',
  'Courier New, monospace',
  'Impact, sans-serif',
  'Comic Sans MS, cursive',
]

const ANIMATION_TYPES = [
  { value: 'none', label: '없음' },
  { value: 'fadeIn', label: '페이드 인' },
  { value: 'slideUp', label: '슬라이드 업' },
  { value: 'typewriter', label: '타이프라이터' },
  { value: 'bounce', label: '바운스' },
]

export default function TextInputModal({
  isOpen,
  textId,
  onClose,
  onSave,
}: TextInputModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Get store functions
  const { insertedTexts, updateText, defaultStyle } = useEditorStore()
  
  // Get current text data
  const currentText = textId ? insertedTexts.find(t => t.id === textId) : null
  
  // Local state for form data
  const [formData, setFormData] = useState({
    content: '',
    startTime: 0,
    endTime: 3,
    style: defaultStyle,
    animation: {
      type: 'fadeIn',
      duration: 0.5,
      delay: 0,
      easing: 'ease-out',
    },
  })

  // Initialize form data when modal opens or text changes
  useEffect(() => {
    if (isOpen && currentText) {
      setFormData({
        content: currentText.content,
        startTime: currentText.startTime,
        endTime: currentText.endTime,
        style: currentText.style,
        animation: currentText.animation || {
          type: 'fadeIn',
          duration: 0.5,
          delay: 0,
          easing: 'ease-out',
        },
      })
    } else if (isOpen && !currentText) {
      // New text - use defaults
      setFormData({
        content: '텍스트를 입력하세요',
        startTime: 0,
        endTime: 3,
        style: defaultStyle,
        animation: {
          type: 'fadeIn',
          duration: 0.5,
          delay: 0,
          easing: 'ease-out',
        },
      })
    }
  }, [isOpen, currentText, defaultStyle])

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus()
        textareaRef.current?.select()
      }, 100)
    }
  }, [isOpen])

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      content: e.target.value,
    }))
  }

  // Handle timing changes
  const handleStartTimeChange = (value: string) => {
    const startTime = parseFloat(value) || 0
    setFormData(prev => ({
      ...prev,
      startTime,
      endTime: Math.max(startTime + 0.1, prev.endTime),
    }))
  }

  const handleEndTimeChange = (value: string) => {
    const endTime = parseFloat(value) || 0.1
    setFormData(prev => ({
      ...prev,
      endTime: Math.max(prev.startTime + 0.1, endTime),
    }))
  }

  // Handle style changes
  const handleStyleChange = (key: keyof TextStyle, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      style: {
        ...prev.style,
        [key]: value,
      },
    }))
  }

  // Handle animation changes
  const handleAnimationChange = (key: keyof TextAnimation, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      animation: {
        ...prev.animation,
        [key]: value,
      },
    }))
  }

  // Handle save
  const handleSave = () => {
    if (!formData.content.trim()) return

    if (currentText) {
      // Update existing text
      updateText(currentText.id, {
        content: formData.content,
        startTime: formData.startTime,
        endTime: formData.endTime,
        style: formData.style,
        animation: formData.animation,
      })
    }

    onSave()
    onClose()
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyPress}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentText ? '텍스트 편집' : '새 텍스트 추가'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Text Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              텍스트 내용
            </label>
            <textarea
              ref={textareaRef}
              value={formData.content}
              onChange={handleContentChange}
              className="w-full h-24 p-3 border border-gray-300 rounded-md resize-vertical text-black
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="텍스트를 입력하세요..."
            />
          </div>

          {/* Timing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작 시간 (초)
              </label>
              <input
                type="number"
                value={formData.startTime.toString()}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                min="0"
                step="0.1"
                className="w-full p-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료 시간 (초)
              </label>
              <input
                type="number"
                value={formData.endTime.toString()}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                min={formData.startTime + 0.1}
                step="0.1"
                className="w-full p-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Style Options */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900">스타일</h3>
            
            {/* Font Family */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                폰트
              </label>
              <select
                value={formData.style.fontFamily}
                onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font} value={font}>
                    {font.split(',')[0]}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                글자 크기: {formData.style.fontSize}px
              </label>
              <Slider
                value={formData.style.fontSize}
                onChange={(value) => handleStyleChange('fontSize', value)}
                minValue={12}
                maxValue={72}
                step={1}
                className="w-full"
              />
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  글자 색상
                </label>
                <ColorPicker
                  value={formData.style.color}
                  onChange={(color) => handleStyleChange('color', color)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  배경 색상
                </label>
                <ColorPicker
                  value={formData.style.backgroundColor || '#000000'}
                  onChange={(color) => handleStyleChange('backgroundColor', color)}
                />
              </div>
            </div>

            {/* Font Weight and Style */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  글자 굵기
                </label>
                <select
                  value={formData.style.fontWeight}
                  onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">보통</option>
                  <option value="bold">굵게</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  글자 스타일
                </label>
                <select
                  value={formData.style.fontStyle}
                  onChange={(e) => handleStyleChange('fontStyle', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">보통</option>
                  <option value="italic">기울임</option>
                </select>
              </div>
            </div>

            {/* Text Align */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                텍스트 정렬
              </label>
              <select
                value={formData.style.textAlign}
                onChange={(e) => handleStyleChange('textAlign', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="left">왼쪽</option>
                <option value="center">가운데</option>
                <option value="right">오른쪽</option>
              </select>
            </div>
          </div>

          {/* Animation Options */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900">애니메이션</h3>
            
            {/* Animation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                애니메이션 타입
              </label>
              <select
                value={formData.animation.type}
                onChange={(e) => handleAnimationChange('type', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ANIMATION_TYPES.map((anim) => (
                  <option key={anim.value} value={anim.value}>
                    {anim.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Animation Duration */}
            {formData.animation.type !== 'none' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  애니메이션 길이: {formData.animation.duration}초
                </label>
                <Slider
                  value={formData.animation.duration}
                  onChange={(value) => handleAnimationChange('duration', value)}
                  minValue={0.1}
                  maxValue={3}
                  step={0.1}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isDisabled={!formData.content.trim()}
          >
            {currentText ? '수정' : '추가'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}