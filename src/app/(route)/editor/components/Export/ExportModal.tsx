'use client'

import React, { useState, useEffect } from 'react'
import { exportOptions, getIconComponent } from './exportOptions'
import { ExportModalProps, ExportFormat } from './ExportTypes'
import Portal from './Portal'

export default function ExportModal({
  isOpen,
  onClose,
  onExport,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('mp4')

  // 모달이 열릴 때 기본 선택값 설정
  useEffect(() => {
    if (isOpen) {
      setSelectedFormat('mp4')
    }
  }, [isOpen])

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  const handleExport = (format?: ExportFormat) => {
    const exportFormat = format || selectedFormat
    onExport(exportFormat)
    onClose()
  }

  if (!isOpen) return null

  // 기본 선택 옵션 (영상 파일 mp4)
  const defaultOption = exportOptions.find((option) => option.id === 'mp4')!
  const DefaultIcon = getIconComponent(defaultOption.icon)

  // 나머지 옵션들
  const otherOptions = exportOptions.filter((option) => option.id !== 'mp4')

  return (
    <Portal>
      <div
        className="fixed inset-0 bg-black/20"
        style={{ zIndex: 9999999 }}
        onClick={handleBackdropClick}
      >
        <div
          className="absolute top-16 right-4 bg-gray-800 rounded-lg shadow-2xl w-[400px] max-h-[80vh] overflow-y-auto border border-[#4D4D59] ring-1 ring-black/10"
          style={{ zIndex: 9999999 }}
        >
          {/* 헤더 */}
          <div className="px-4 py-3 border-b border-gray-400">
            <h2 className="text-lg font-medium text-white">내보내기</h2>
          </div>

          {/* 콘텐츠 */}
          <div className="p-4">
            {/* 기본 선택 옵션 - 영상 파일 (mp4) */}
            <div
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-all mb-4 ${
                selectedFormat === 'mp4'
                  ? 'bg-gray-400 bg-opacity-20 border border-gray-400'
                  : 'hover:bg-[#383842]'
              }`}
              onClick={() => handleExport('mp4')}
            >
              <div className="flex items-center flex-1">
                <div className="w-6 h-6 mr-3 text-white flex items-center justify-center bg-gray-700 rounded p-1">
                  <DefaultIcon className="w-full h-full" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm">
                    {defaultOption.label}({defaultOption.description})
                  </span>
                  <span className="text-xs bg-gray-700 text-white px-2 py-1 rounded">
                    최근 사용
                  </span>
                </div>
              </div>
            </div>

            {/* 다른 형식으로 내보내기 */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-[#B3B3B3] mb-3">
                다른 형식으로 내보내기
              </h3>

              <div className="space-y-1">
                {otherOptions.map((option) => {
                  const IconComponent = getIconComponent(option.icon)
                  const isSelected = selectedFormat === option.id

                  return (
                    <div
                      key={option.id}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-gray-200 bg-opacity-20 border border-gray-200'
                          : 'hover:bg-gray-700'
                      }`}
                      onClick={() => handleExport(option.id)}
                    >
                      <div className="flex items-center flex-1">
                        <div className="w-5 h-5 mr-3 text-gray-200 flex items-center justify-center bg-gray-500 rounded p-1">
                          <IconComponent className="w-full h-full" />
                        </div>
                        <div>
                          <span className="text-sm text-white">
                            {option.label}
                          </span>
                          <span className="text-sm text-gray-400 ml-1">
                            ({option.description})
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
