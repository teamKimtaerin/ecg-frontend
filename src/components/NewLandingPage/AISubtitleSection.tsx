'use client'

import React from 'react'

const AISubtitleSection: React.FC = () => {
  return (
    <>
      {/* Section 1: AI 음성인식으로 만드는 자동 자막 */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto text-center max-w-7xl">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-500 mb-6">
              AI 음성인식으로 만드는 자동 자막
            </h2>
            <p className="text-base text-black max-w-3xl mx-auto leading-relaxed">
              음성 인식으로 만든 자동 자막을 약간만 수정하면 긴 영상도 순식간에
              자막 완성.
              <br />
              자동으로 대본을 인식해서 영상 속 자막으로 넣을 수도 있어요
            </p>
          </div>

          {/* CTA Button below hero */}
          <section className="py-8 text-center bg-white">
            <button className="px-8 py-3 text-base font-bold bg-white text-black border-2 border-black rounded-full hover:bg-black hover:text-white transition-all shadow-md hover:shadow-lg">
              자동 자막 체험하기
            </button>
          </section>

          {/* Image placeholder with rounded corners */}
          <div className="bg-gray-50 rounded-3xl p-8 mx-auto max-w-4xl border border-gray-200">
            <div className="bg-white border border-gray-300 rounded-3xl overflow-hidden shadow-sm">
              <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center border-b border-gray-200">
                <span className="text-gray-600 font-medium">
                  편집 인터페이스 이미지
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default AISubtitleSection
