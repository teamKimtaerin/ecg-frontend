'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useEditorStore } from '../../store'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'

interface TextInputModalProps {
  isOpen: boolean
  textId: string | null
  onClose: () => void
  onSave: () => void
}

export default function TextInputModal({
  isOpen,
  textId,
  onClose,
  onSave,
}: TextInputModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Get store functions
  const { insertedTexts, updateText, selectText } = useEditorStore()

  // Get current text data
  const currentText = textId ? insertedTexts.find((t) => t.id === textId) : null

  // Local state for content only
  const [content, setContent] = useState('')

  // Initialize content when modal opens
  useEffect(() => {
    if (isOpen) {
      setContent(currentText ? currentText.content : '텍스트를 입력하세요')
    }
  }, [isOpen, currentText])

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
    setContent(e.target.value)
  }

  // Handle save
  const handleSave = () => {
    if (!content.trim()) return

    if (currentText) {
      // Update existing text content only
      updateText(currentText.id, {
        content: content,
      })
      // Select the text to open editing panel
      selectText(currentText.id)
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
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
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
        <div className="p-6">
          {/* Text Content */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              텍스트 내용
            </label>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              className="w-full h-24 p-3 border border-gray-300 rounded-md resize-vertical text-black
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="텍스트를 입력하세요..."
            />
          </div>

          {currentText && (
            <div className="text-sm text-gray-600 mb-4">
              스타일과 타이밍은 하단 편집 패널에서 조정할 수 있습니다.
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              isDisabled={!content.trim()}
            >
              {currentText ? '수정' : '추가'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
