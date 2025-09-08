'use client'

import React from 'react'

export interface DynamicSubtitleSectionProps {
  onApplyDynamicSubtitleClick?: () => void
}

const DynamicSubtitleSection: React.FC<DynamicSubtitleSectionProps> = ({
  onApplyDynamicSubtitleClick,
}) => {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="container mx-auto text-center max-w-7xl">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-500 mb-6">
            생생하고 몰입감있는 동적 자막
          </h2>
          <p className="text-base text-black max-w-3xl mx-auto leading-relaxed">
            음성 인식으로 만든 자동 자막을 약간만 수정하면 긴 영상도 순식간에
            자막 완성.
            <br />
            자동으로 대본을 인식해서 영상 속 자막으로 넣을 수도 있어요
          </p>
        </div>

        <section className="py-8 text-center">
          <button
            onClick={onApplyDynamicSubtitleClick}
            className="px-8 py-3 text-base font-bold bg-white text-black border-2 border-black rounded-full hover:bg-black hover:text-white transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            템플릿 적용해보기
          </button>
        </section>

        {/* Subtitle style tabs */}
        <div className="flex justify-center space-x-3 mb-8 flex-wrap gap-2">
          <span className="px-4 py-2 bg-black text-white rounded-full text-xs font-semibold shadow-md cursor-pointer">
            CI
          </span>
          <span className="px-4 py-2 bg-white text-black border-2 border-black rounded-full text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer">
            modern
          </span>
          <span className="px-4 py-2 bg-white text-black border-2 border-black rounded-full text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer">
            daisy
          </span>
          <span className="px-4 py-2 bg-white text-black border-2 border-black rounded-full text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer">
            minimal
          </span>
          <span className="px-4 py-2 bg-white text-black border-2 border-black rounded-full text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer">
            dynamic
          </span>
        </div>

        {/* Video preview */}
        <div className="bg-white rounded-3xl p-8 mx-auto max-w-4xl mb-8 border border-gray-200 shadow-lg">
          <div className="aspect-video bg-gray-100 border border-gray-300 rounded-3xl shadow-sm flex items-center justify-center">
            <span className="text-gray-600 font-medium">
              동적 자막 미리보기 영상
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DynamicSubtitleSection
