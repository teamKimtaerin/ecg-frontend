'use client'

import React from 'react'
import {
  LuX,
  LuPlay,
  LuVolume2,
  LuMenu,
  LuChevronDown
} from 'react-icons/lu'
import { RenderProgressModalProps } from './ProgressTypes'

export default function RenderProgressModal({
  isOpen,
  onClose,
  fileName,
  progress,
  analysisTime,
  userName = '테스트테스트',
}: RenderProgressModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">
          3분의 음성을 분석하고 있습니다.
        </h1>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LuX className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
        {/* Greeting */}
        <div className="mb-8">
          <h2 className="text-lg text-gray-900 mb-2">
            {userName}님 안녕하세요!
          </h2>
          <p className="text-gray-600">
            현재 진행 중인 음성 분석까지 포함한 이번 달 사용하신 음성 분석 시간은 총 8분입니다.
          </p>
        </div>

        {/* Progress Time Display */}
        <div className="flex justify-end items-center mb-4">
          <div className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">
            <span className="text-gray-300">사용한 분석시간</span>
            <span className="ml-2 font-bold">{analysisTime}</span>
          </div>
        </div>

        {/* Video Player Section */}
        <div className="mb-8">
          {/* File Name */}
          <div className="flex items-center justify-center mb-4">
            <span className="text-gray-900 font-medium">{fileName}</span>
          </div>

          {/* Video Player */}
          <div className="bg-black rounded-lg overflow-hidden mb-6">
            <div className="relative aspect-video">
              {/* Friends thumbnail image */}
              <img
                src="/upload-progress/friends.png"
                alt="Friends Scene"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-3">
                <div className="flex items-center justify-between text-white mb-2">
                  <div className="flex items-center space-x-3">
                    <button className="p-1.5 hover:bg-white/20 rounded-full">
                      <LuPlay className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-mono">0:00 / 2:23</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button className="p-1.5 hover:bg-white/20 rounded">
                      <LuVolume2 className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-white/20 rounded">
                      <span className="text-sm">⛶</span>
                    </button>
                    <button className="p-1.5 hover:bg-white/20 rounded">
                      <LuMenu className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/30 h-1 rounded-full">
                  <div className="bg-red-500 h-1 rounded-full w-1" style={{width: '0.5%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tip Section */}
        <div className="mb-8">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 text-lg">💡</span>
              </div>
              <h3 className="text-lg font-semibold text-blue-900">알고 계셨나요?</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <span className="font-medium mr-2">따라하다</span>
                <LuChevronDown className="w-4 h-4 mx-1" />
                <span className="font-medium mr-2">따라</span>
                <LuChevronDown className="w-4 h-4 mx-1" />
                <span className="font-medium">하다</span>
                <span className="ml-2">로 나누어짐</span>
              </div>

              <p className="text-gray-600 text-sm">
                위드를 더블 클릭하고 재생바를 옮긴 뒤
                <span className="inline-flex items-center mx-1">
                  <span className="bg-gray-200 px-2 py-1 rounded text-xs">Ctrl</span>
                  <span className="mx-1">+</span>
                  <span className="bg-gray-200 px-2 py-1 rounded text-xs">Z</span>
                </span>
                나누기를 클릭해 보세요.
              </p>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-2xl font-bold text-gray-900">{progress}%</span>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <LuChevronDown className="w-5 h-5 text-blue-600" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}