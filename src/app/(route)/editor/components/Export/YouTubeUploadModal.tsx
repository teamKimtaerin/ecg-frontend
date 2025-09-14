'use client'

import React, { useState, useEffect } from 'react'
import { FaChevronDown, FaArrowLeft } from 'react-icons/fa'
import { YouTubeUploadModalProps, YouTubeUploadSettings } from './ExportTypes'
import Portal from './Portal'

export default function YouTubeUploadModal({
  isOpen,
  onClose,
  onUpload,
  videoThumbnail,
  defaultTitle = '202509142147',
}: YouTubeUploadModalProps) {
  const [settings, setSettings] = useState<YouTubeUploadSettings>({
    title: defaultTitle,
    resolution: '720p',
    quality: '추천 품질',
    frameRate: '30fps',
    format: 'MP4',
  })

  // 모달이 열릴 때 기본값으로 리셋
  useEffect(() => {
    if (isOpen) {
      setSettings({
        title: defaultTitle,
        resolution: '720p',
        quality: '추천 품질',
        frameRate: '30fps',
        format: 'MP4',
      })
    }
  }, [isOpen, defaultTitle])

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

  const handleUpload = () => {
    onUpload(settings)
    onClose()
  }

  const handleInputChange = (field: keyof YouTubeUploadSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <Portal>
      <div
        className="fixed inset-0 bg-black/20"
        style={{ zIndex: 9999999 }}
        onClick={handleBackdropClick}
      >
        <div
          className="absolute top-16 right-4 bg-white rounded-lg shadow-2xl w-[400px] max-h-[80vh] overflow-y-auto border border-gray-200 ring-1 ring-black/10"
          style={{ zIndex: 9999999 }}
        >
          {/* 헤더 */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center">
            <button
              onClick={onClose}
              className="mr-3 text-gray-600 hover:text-black transition-colors"
            >
              <FaArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-medium text-black">내보내기 설정</h2>
          </div>

          {/* 콘텐츠 */}
          <div className="p-4">
            {/* 동영상 커버 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-black mb-3">동영상 커버</h3>
              <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                {videoThumbnail ? (
                  <img
                    src={videoThumbnail}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="bg-orange-400 w-16 h-12 rounded flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            {/* 제목 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-black mb-2">제목</h3>
              <input
                type="text"
                value={settings.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-gray-50"
                placeholder="동영상 제목을 입력하세요"
              />
            </div>

            {/* 해상도 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-black mb-2">해상도</h3>
              <div className="relative">
                <select
                  value={settings.resolution}
                  onChange={(e) => handleInputChange('resolution', e.target.value as YouTubeUploadSettings['resolution'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-gray-50 appearance-none cursor-pointer"
                >
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="4K">4K</option>
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
              </div>
            </div>

            {/* 품질 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-black mb-2">품질</h3>
              <div className="relative">
                <select
                  value={settings.quality}
                  onChange={(e) => handleInputChange('quality', e.target.value as YouTubeUploadSettings['quality'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-gray-50 appearance-none cursor-pointer"
                >
                  <option value="추천 품질">추천 품질</option>
                  <option value="고품질">고품질</option>
                  <option value="최고 품질">최고 품질</option>
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
              </div>
            </div>

            {/* 프레임 속도 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-black mb-2">프레임 속도</h3>
              <div className="relative">
                <select
                  value={settings.frameRate}
                  onChange={(e) => handleInputChange('frameRate', e.target.value as YouTubeUploadSettings['frameRate'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-gray-50 appearance-none cursor-pointer"
                >
                  <option value="30fps">30fps</option>
                  <option value="60fps">60fps</option>
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
              </div>
            </div>

            {/* 형식 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-black mb-2">형식</h3>
              <div className="relative">
                <select
                  value={settings.format}
                  onChange={(e) => handleInputChange('format', e.target.value as YouTubeUploadSettings['format'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-gray-50 appearance-none cursor-pointer"
                >
                  <option value="MP4">MP4</option>
                  <option value="MOV">MOV</option>
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
              </div>
            </div>

            {/* 내보내기 버튼 */}
            <button
              onClick={handleUpload}
              className="w-full bg-cyan-400 hover:bg-cyan-500 text-white font-medium py-3 rounded-lg transition-colors duration-200"
            >
              내보내기
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}