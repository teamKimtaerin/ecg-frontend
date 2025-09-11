import React from 'react'

interface ClipTimelineProps {
  index: number
}

export default function ClipTimeline({ index }: ClipTimelineProps) {
  return (
    <div className="flex justify-center items-start pt-2">
      <span className="text-sm text-gray-800 font-mono font-bold z-10 relative">
        {index}
      </span>
    </div>
  )
}
