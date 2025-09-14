'use client'

import React from 'react'
import { FaChevronDown } from 'react-icons/fa'
import { YouTubePrivacy, YouTubeUploadData } from '../ExportTypes'

interface YouTubeUploadFormProps {
  data: YouTubeUploadData
  onDataChange: (field: keyof YouTubeUploadData, value: string) => void
  onPrivacyChange: (privacy: YouTubePrivacy) => void
}

export default function YouTubeUploadForm({
  data,
  onDataChange,
  onPrivacyChange,
}: YouTubeUploadFormProps) {
  return (
    <div className="p-4 overflow-y-auto flex-1 min-h-0" style={{ maxHeight: 'calc(90vh - 120px)' }}>
      {/* YouTube 채널 */}
      <div className="mb-3">
        <label className="text-xs font-medium text-black mb-1 block">YouTube 채널</label>
        <div className="relative">
          <select
            value={data.channel}
            onChange={(e) => onDataChange('channel', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white appearance-none cursor-pointer"
          >
            <option value="테스트테스트">🎬 테스트테스트</option>
          </select>
          <FaChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
        </div>
      </div>

      {/* 제목 */}
      <div className="mb-3">
        <label className="text-xs font-medium text-black mb-1 block">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onDataChange('title', e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-gray-50"
          placeholder="동영상 제목을 입력하세요"
        />
        <div className="text-right text-xs text-gray-500 mt-1">{data.title.length}/100</div>
      </div>

      {/* 설명 */}
      <div className="mb-3">
        <label className="text-xs font-medium text-black mb-1 block">설명</label>
        <textarea
          value={data.description}
          onChange={(e) => onDataChange('description', e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-gray-50 resize-none"
          rows={3}
          placeholder="동영상에 대한 설명을 입력하세요"
        />
        <div className="text-right text-xs text-gray-500 mt-1">{data.description.length}/5000</div>
      </div>

      {/* 동영상 커버 */}
      <div className="mb-3">
        <label className="text-xs font-medium text-black mb-2 block">동영상 커버</label>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-2">커버로 사용할 이미지를 선택하세요.</p>
          <div className="flex gap-2">
            <div className="w-20 h-12 bg-gray-200 rounded border-2 border-blue-500 overflow-hidden">
              <img
                src="/youtube-upload/sample-thumbnail.png"
                alt="Selected thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
            <button className="w-20 h-12 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
              <span>✏️</span>
            </button>
          </div>
        </div>
      </div>

      {/* 공개 여부 */}
      <div className="mb-6">
        <label className="text-xs font-medium text-black mb-3 block">공개 여부</label>
        <div className="space-y-4">
          {[
            { value: 'private' as YouTubePrivacy, label: '비공개', desc: '내 계정만 동영상을 볼 수 있습니다' },
            { value: 'unlisted' as YouTubePrivacy, label: '일부 공개', desc: '링크를 아는 사람만 동영상을 볼 수 있습니다' },
            { value: 'public' as YouTubePrivacy, label: '공개', desc: '모든 사용자가 동영상을 검색하고 볼 수 있습니다' }
          ].map((option) => (
            <label key={option.value} className="flex items-start space-x-3 cursor-pointer py-1">
              <input
                type="radio"
                name="privacy"
                value={option.value}
                checked={data.privacy === option.value}
                onChange={() => onPrivacyChange(option.value)}
                className="mt-1 w-3 h-3 text-blue-600 border-gray-300 focus:ring-blue-500 flex-shrink-0"
              />
              <div className="flex-1">
                <div className="text-xs font-medium text-black mb-1">{option.label}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{option.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}