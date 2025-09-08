'use client'

import React from 'react'

interface EmptyStateProps {
  onNewProjectClick: () => void
  onOpenProjectClick: () => void
}

const EmptyState: React.FC<EmptyStateProps> = ({
  onNewProjectClick,
  onOpenProjectClick,
}) => {
  return (
    <div className="flex-1 bg-gray-200 relative">
      {/* New Project Notification Card */}
      <div className="absolute top-16 left-5">
        <div className="bg-white rounded-[20px] border border-gray-300 w-[250px] h-10 relative">
          {/* NEW Badge */}
          <div className="absolute left-5 top-2 bg-yellow-400 rounded px-2 py-1">
            <span className="text-white text-[10px] font-bold">NEW</span>
          </div>

          {/* Text */}
          <div className="absolute left-[75px] top-3">
            <span className="text-gray-800 text-[13px] font-medium">
              새 프로젝트 시작하기
            </span>
          </div>

          {/* Close button */}
          <button className="absolute right-5 top-3 text-gray-500 text-sm hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Subtitle */}
        <div className="mt-4 ml-5">
          <span className="text-gray-500 text-xs">
            나만의 첫 영상을 만들어보세요!
          </span>
        </div>
      </div>

      {/* Center Cards */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex space-x-7">
        {/* New Project Card */}
        <button
          onClick={onNewProjectClick}
          className="bg-black rounded-xl w-[250px] h-[150px] flex flex-col items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
        >
          <div className="text-white text-4xl font-bold mb-2">+</div>
          <div className="text-white text-base font-medium">새로 만들기</div>
        </button>

        {/* Open Project Card */}
        <button
          onClick={onOpenProjectClick}
          className="bg-gray-500 rounded-xl w-[250px] h-[150px] flex flex-col items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
        >
          <div className="text-black text-4xl mb-2">📁</div>
          <div className="text-white text-base font-medium">프로젝트 열기</div>
        </button>
      </div>
    </div>
  )
}

export default EmptyState
