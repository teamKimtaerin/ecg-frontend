'use client'

import React from 'react'

export interface FreeAssetsSectionProps {
  onTryAutoSubtitleClick?: () => void
}

const FreeAssetsSection: React.FC<FreeAssetsSectionProps> = ({
  onTryAutoSubtitleClick,
}) => {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="container mx-auto text-center max-w-7xl">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-500 mb-6">
            다양한 무료 에셋과 리소스
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
            onClick={onTryAutoSubtitleClick}
            className="px-8 py-3 text-base font-bold bg-white text-black border-2 border-black rounded-full hover:bg-black hover:text-white transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            다양한 자막 체험하기
          </button>
        </section>

        {/* Assets interface image */}
        <div className="bg-white rounded-3xl p-8 mx-auto max-w-5xl mb-12 border border-gray-200 shadow-lg">
          <div className="aspect-[5/3] bg-gray-100 border border-gray-300 rounded-3xl shadow-sm flex items-center justify-center">
            <span className="text-gray-600 font-medium text-lg">
              에셋 라이브러리 인터페이스
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FreeAssetsSection
