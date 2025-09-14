'use client'

import React from 'react'

interface PlaybackHeadProps {
  position: number      // 현재 재생 위치 (초)
  zoom: number         // 줌 레벨
  viewportStart: number // 뷰포트 시작 시간
  height?: number      // 타임라인 높이
  className?: string
}

const PlaybackHead: React.FC<PlaybackHeadProps> = ({
  position,
  zoom,
  viewportStart,
  height = 400,
  className = '',
}) => {
  // 재생 위치를 픽셀 좌표로 변환
  const pixelPosition = (position - viewportStart) * zoom

  // 뷰포트 범위를 벗어난 경우 표시하지 않음
  if (position < viewportStart || pixelPosition < 0) {
    return null
  }

  return (
    <div
      className={`playback-head absolute top-0 pointer-events-none z-20 ${className}`}
      style={{
        left: `${pixelPosition}px`,
        height: `${height}px`,
        transform: 'translateX(-1px)', // 중앙 정렬을 위해 라인 두께의 절반만큼 이동
      }}
    >
      {/* 메인 라인 */}
      <div className="absolute inset-0 w-0.5 bg-red-500 shadow-sm" />
      
      {/* 상단 핸들 (삼각형) */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full">
        <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-red-500" />
      </div>
      
      {/* 현재 시간 표시 */}
      <div className="absolute top-0 left-2 transform -translate-y-full bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
        {Math.floor(position / 60)}:{(position % 60).toFixed(1).padStart(4, '0')}
      </div>
    </div>
  )
}

export default PlaybackHead