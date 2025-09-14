'use client'

import React from 'react'

interface TimelineRulerProps {
  startTime: number
  endTime: number
  zoom: number
  gridSize: number
  height?: number
  className?: string
}

const TimelineRuler: React.FC<TimelineRulerProps> = ({
  startTime,
  endTime,
  zoom,
  gridSize,
  height = 32,
  className = '',
}) => {
  // 시간을 픽셀로 변환
  const timeToPixel = (time: number): number => {
    return (time - startTime) * zoom
  }

  // 시간을 포맷팅 (MM:SS 형식)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 적절한 눈금 간격 계산
  const calculateTickInterval = (): number => {
    const pixelsPerSecond = zoom
    
    // 최소 40px 간격으로 눈금 표시
    const minPixelsBetweenTicks = 40
    const minSecondsBetweenTicks = minPixelsBetweenTicks / pixelsPerSecond
    
    // 적절한 간격 선택 (1, 5, 10, 30, 60초 등)
    const intervals = [0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600]
    
    for (const interval of intervals) {
      if (interval >= minSecondsBetweenTicks) {
        return interval
      }
    }
    
    return 600 // 기본값: 10분
  }

  const tickInterval = calculateTickInterval()
  
  // 눈금 생성
  const ticks = []
  const firstTick = Math.ceil(startTime / tickInterval) * tickInterval
  
  for (let time = firstTick; time <= endTime; time += tickInterval) {
    const x = timeToPixel(time)
    const isSecondTick = time % 1 === 0
    const isMajorTick = time % (tickInterval * 5) === 0 || tickInterval >= 60
    
    ticks.push({
      time,
      x,
      isMajor: isMajorTick,
      showLabel: isMajorTick || (isSecondTick && tickInterval <= 1),
    })
  }

  // 보조 눈금 생성 (더 세밀한 간격)
  const subTicks = []
  if (tickInterval >= 5) {
    const subInterval = tickInterval / 5
    const firstSubTick = Math.ceil(startTime / subInterval) * subInterval
    
    for (let time = firstSubTick; time <= endTime; time += subInterval) {
      if (time % tickInterval !== 0) { // 메인 눈금과 겹치지 않는 경우만
        const x = timeToPixel(time)
        subTicks.push({ time, x })
      }
    }
  }

  return (
    <div 
      className={`timeline-ruler bg-white border-b border-gray-200 relative ${className}`}
      style={{ height: `${height}px` }}
    >
      {/* 배경 */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />
      
      {/* 보조 눈금 */}
      {subTicks.map((tick, index) => (
        <div
          key={`sub-${index}`}
          className="absolute bottom-0 w-px bg-gray-300"
          style={{
            left: `${tick.x}px`,
            height: '8px',
          }}
        />
      ))}
      
      {/* 메인 눈금과 라벨 */}
      {ticks.map((tick, index) => (
        <div
          key={index}
          className="absolute bottom-0 flex flex-col items-center"
          style={{
            left: `${tick.x}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {/* 눈금 선 */}
          <div
            className={`w-px bg-gray-600 ${tick.isMajor ? 'h-4' : 'h-3'}`}
          />
          
          {/* 시간 라벨 */}
          {tick.showLabel && (
            <div className="text-xs text-gray-700 mt-1 whitespace-nowrap select-none">
              {formatTime(tick.time)}
            </div>
          )}
        </div>
      ))}
      
      {/* 현재 시간 표시 (0초 지점) */}
      {startTime <= 0 && endTime >= 0 && (
        <div
          className="absolute bottom-0 flex flex-col items-center text-blue-600"
          style={{
            left: `${timeToPixel(0)}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="w-px bg-blue-600 h-4" />
          <div className="text-xs font-medium mt-1">0:00</div>
        </div>
      )}
    </div>
  )
}

export default TimelineRuler