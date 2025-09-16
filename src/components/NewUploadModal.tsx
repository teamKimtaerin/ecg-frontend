'use client'

import React, { useState, useRef, useCallback } from 'react'
import { LuLink } from 'react-icons/lu'
import { FaYoutube, FaVimeo } from 'react-icons/fa'
import Modal from '@/components/ui/Modal'

interface NewUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onFileSelect?: (files: File[]) => void
  onStartTranscription?: (data: {
    files: File[]
    settings: TranscriptionSettings
  }) => Promise<void>
  acceptedTypes?: string[]
  maxFileSize?: number
  multiple?: boolean
  isLoading?: boolean
}

interface TranscriptionSettings {
  language: string
}

type TabType = 'upload' | 'link'

const NewUploadModal: React.FC<NewUploadModalProps> = ({
  isOpen,
  onClose,
  onFileSelect,
  onStartTranscription,
  acceptedTypes = ['audio/*', 'video/*'],
  maxFileSize = 100 * 1024 * 1024, // 100MB
  multiple = true,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('upload')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [language, setLanguage] = useState('Korean (South Korea)')
  const [isDragOver, setIsDragOver] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        // 파일 크기 검증
        const validFiles = files.filter((file) => {
          if (maxFileSize && file.size > maxFileSize) {
            alert(
              `${file.name} 파일이 너무 큽니다. 최대 ${Math.round(maxFileSize / 1024 / 1024)}MB까지 업로드 가능합니다.`
            )
            return false
          }
          return true
        })

        if (validFiles.length > 0) {
          setSelectedFiles(validFiles)
          onFileSelect?.(validFiles)
        }
      }
    },
    [onFileSelect, maxFileSize]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        // 파일 크기 검증
        const validFiles = files.filter((file) => {
          if (maxFileSize && file.size > maxFileSize) {
            alert(
              `${file.name} 파일이 너무 큽니다. 최대 ${Math.round(maxFileSize / 1024 / 1024)}MB까지 업로드 가능합니다.`
            )
            return false
          }
          return true
        })

        if (validFiles.length > 0) {
          setSelectedFiles(validFiles)
          onFileSelect?.(validFiles)
        }
      }
    },
    [onFileSelect, maxFileSize]
  )

  const handleFileSelectClick = () => {
    fileInputRef.current?.click()
  }

  const handleStartTranscription = async () => {
    if (selectedFiles.length === 0) return

    const settings: TranscriptionSettings = {
      language,
    }

    try {
      await onStartTranscription?.({
        files: selectedFiles,
        settings,
      })
    } catch (error) {
      console.error('Transcription failed:', error)
    }
  }

  const handleGoBack = () => {
    setSelectedFiles([])
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-[700px] max-w-[90vw] max-h-[85vh]"
      closeOnBackdropClick={!isLoading}
      closeOnEsc={!isLoading}
      scrollable={true}
      aria-label="파일 업로드"
    >
      <div className="bg-white rounded-xl p-8 relative">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            1. Choose input method
          </h1>

          {/* Tabs */}
          <div className="flex">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 h-12 text-base font-bold transition-colors cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-gray-900 text-white rounded-l-lg'
                  : 'bg-gray-100 text-gray-900 rounded-l-lg border border-gray-300'
              }`}
            >
              Upload Files
            </button>
            <button
              onClick={() => setActiveTab('link')}
              className={`flex-1 h-12 text-base font-medium transition-colors cursor-pointer ${
                activeTab === 'link'
                  ? 'bg-gray-900 text-white rounded-r-lg'
                  : 'bg-gray-100 text-gray-900 rounded-r-lg border border-gray-300'
              }`}
            >
              Import Link
            </button>
          </div>
        </div>

        {/* Upload Tab Content */}
        {activeTab === 'upload' && (
          <div className="mb-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  파일 올려놓기
                </h3>
                <p className="text-sm text-gray-500">
                  Drag or click to browse from your computer
                </p>
              </div>

              <button
                onClick={handleFileSelectClick}
                className="bg-gray-900 text-white px-6 py-2 rounded font-bold hover:bg-gray-800 transition-colors cursor-pointer"
                disabled={isLoading}
              >
                파일 선택
              </button>

              <p className="text-sm text-gray-500 mt-4">audio, video</p>

              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedTypes.join(',')}
                onChange={handleFileInputChange}
                multiple={multiple}
                className="hidden"
                disabled={isLoading}
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Selected Files:
                </h4>
                <ul className="text-sm text-gray-600">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="truncate">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Link Tab Content */}
        {activeTab === 'link' && (
          <div className="mb-6">
            {/* Import from URL Section */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <LuLink className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Import from URL
              </h3>
              <p className="text-gray-600 text-sm">
                Paste a video URL from supported platforms
              </p>
            </div>

            {/* Video URL Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Video URL
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Supported Platforms */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Supported Platforms
              </h4>
              <div className="space-y-3">
                {/* YouTube */}
                <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-10 h-10 bg-red-500 rounded flex items-center justify-center mr-3">
                    <FaYoutube className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">YouTube</p>
                    <p className="text-xs text-gray-500">
                      https://youtube.com/watch?v=...
                    </p>
                  </div>
                </div>

                {/* Vimeo */}
                <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center mr-3">
                    <FaVimeo className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Vimeo</p>
                    <p className="text-xs text-gray-500">
                      https://vimeo.com/...
                    </p>
                  </div>
                </div>

                {/* Direct URL */}
                <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center mr-3">
                    <LuLink className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Direct URL
                    </p>
                    <p className="text-xs text-gray-500">
                      https://example.com/video.mp4
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transcription Settings */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            2. Configure transcription settings
          </h2>

          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900 mb-4">
              Transcription Settings
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Language
              </label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                >
                  <option value="Korean (South Korea)">
                    Korean (South Korea)
                  </option>
                  <option value="English (United States)">
                    English (United States)
                  </option>
                  <option value="Japanese (Japan)">Japanese (Japan)</option>
                  <option value="Chinese (Simplified)">
                    Chinese (Simplified)
                  </option>
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Select the primary language of your video content
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleGoBack}
            className="px-6 py-2 text-gray-500 font-bold text-sm hover:text-gray-700 transition-colors cursor-pointer"
            disabled={isLoading}
          >
            뒤로가기
          </button>
          <button
            onClick={handleStartTranscription}
            disabled={
              (activeTab === 'upload' && selectedFiles.length === 0) ||
              (activeTab === 'link' && !videoUrl.trim()) ||
              isLoading
            }
            className={`px-8 py-2 rounded font-bold text-white transition-colors ${
              (activeTab === 'upload' && selectedFiles.length === 0) ||
              (activeTab === 'link' && !videoUrl.trim()) ||
              isLoading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gray-900 hover:bg-gray-800 cursor-pointer'
            }`}
          >
            {isLoading ? '처리 중...' : '시작하기'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default NewUploadModal
