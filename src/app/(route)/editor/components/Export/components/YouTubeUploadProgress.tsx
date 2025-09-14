'use client'

import React from 'react'
import { YouTubeUploadData } from '../ExportTypes'

interface YouTubeUploadProgressProps {
  progress: number
  data: YouTubeUploadData
}

export default function YouTubeUploadProgress({
  progress,
  data,
}: YouTubeUploadProgressProps) {
  return (
    <div className="flex h-full">
      {/* 좌측 - 비디오 미리보기 */}
      <div className="w-2/5 p-6 flex items-center justify-center">
        <div className="relative bg-black rounded-lg overflow-hidden w-full max-w-sm">
          <img
            src="/youtube-upload/sample-thumbnail.png"
            alt="Uploading video"
            className="w-full h-auto"
          />
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
            <div className="text-4xl md:text-6xl font-bold text-white mb-2">{progress}%</div>
            <div className="text-white text-base md:text-lg mb-4">내보내는 중...</div>
            <div className="text-xs md:text-sm text-white/70 mb-2 text-center px-4">브라우저를 닫아도 내보내기가 중단되지 않습니다</div>
            <div className="text-xs md:text-sm text-white/70 text-center px-4">동영상이 위험님의 공간에 저장됩니다.</div>
          </div>
          <button className="absolute top-4 left-4 bg-gray-800/50 text-white px-4 py-2 rounded text-sm">
            취소
          </button>
        </div>
      </div>

      {/* 우측 - 진행 상태 */}
      <div className="w-3/5 p-6 overflow-y-auto" style={{ maxHeight: '90vh' }}>
        <div className="space-y-6">
          <h2 className="text-xl font-medium text-black">YouTube 채널</h2>

          <div>
            <div className="flex items-center mb-2">
              <span className="text-gray-600 text-sm mr-2">🎬</span>
              <select className="border border-gray-300 rounded px-2 py-1 text-sm" disabled>
                <option>테스트테스트</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-black mb-2 block">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.title}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-black"
            />
            <div className="text-right text-xs text-gray-500 mt-1">{data.title.length}/100</div>
          </div>

          <div>
            <label className="text-sm font-medium text-black mb-2 block">설명</label>
            <textarea
              value={data.description}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-black resize-none"
              rows={3}
            />
            <div className="text-right text-xs text-gray-500 mt-1">{data.description.length}/5000</div>
          </div>

          <div>
            <label className="text-sm font-medium text-black mb-3 block">동영상 커버</label>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">커버로 사용할 이미지를 선택하세요.</p>
              <div className="w-24 h-16 bg-gray-200 rounded border-2 border-cyan-400 overflow-hidden">
                <img
                  src="/youtube-upload/sample-thumbnail.png"
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* 진행 표시 */}
              <div className="mt-4 flex items-center text-cyan-400">
                <div className="w-6 h-6 mr-2">
                  <svg className="animate-spin" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="31.416" strokeDashoffset="15.708"></circle>
                  </svg>
                </div>
                <span className="text-sm">업로드 중...</span>
              </div>
            </div>
          </div>

          <button
            disabled
            className="w-full bg-gray-300 text-gray-500 font-medium py-3 rounded-lg cursor-not-allowed"
          >
            공유
          </button>
        </div>
      </div>
    </div>
  )
}