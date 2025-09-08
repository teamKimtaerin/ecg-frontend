'use client'

import React from 'react'
import TypingText from './TypingText'

export interface HeroSectionProps {
  onQuickStartClick?: () => void
}

const HeroSection: React.FC<HeroSectionProps> = ({ onQuickStartClick }) => {
  return (
    <section className="py-24 px-4 bg-gray-50">
      <div className="container mx-auto text-center max-w-7xl">
        <div className="mb-6">
          <span className="inline-block px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
            AI가 도와줄게요
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-black mb-8 leading-tight">
          <TypingText
            texts={[
              '누구나 영상 편집을 쉽고 즐겁게',
              'AI가 만드는 완벽한 자막',
              '클릭 한 번으로 전문가 수준',
              '동적 자막으로 생생한 영상',
            ]}
            className="block"
            typingSpeed={120}
            deleteSpeed={80}
            pauseDuration={2500}
            startDelay={800}
          />
        </h1>

        <div className="space-y-4 text-xl text-gray-600 mb-12 max-w-4xl mx-auto">
          <p>음성 인식 기능을 통한 자막 자동 생성</p>
          <p>직접 녹음하지 않아도 되는 500여 개의 AI 목소리</p>
          <p>상업적으로 사용가능한 무료 이미지, 비디오, 배경 음악</p>
          <p>AI가 대본과 영상을 한 번에, 텍스트로 비디오 만들기</p>
        </div>

        <div className="mb-8">
          <button
            onClick={onQuickStartClick}
            className="px-8 py-4 text-lg font-semibold bg-black text-white rounded-full hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer"
          >
            빠른 시작
          </button>
        </div>

        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">ⓘ</span>
          </div>
          <span>빠른 시작으로 빠르게 영상에 자막을 생성할 수 있습니다.</span>
        </div>

        {/* Video Placeholder */}
        <div className="mt-16 mx-auto max-w-4xl">
          <div className="aspect-video bg-gray-200 border border-gray-300 rounded-2xl shadow-lg flex items-center justify-center">
            <span className="text-gray-500 text-lg font-medium">
              영상 미리보기
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
