import React from 'react'

interface ClipTimelineProps {
  index: number
}

export default function ClipTimeline({ index }: ClipTimelineProps) {
  return (
    <div className="flex justify-center items-center flex-1">
      <span className="text-sm text-[#F2F2F2] font-mono font-bold">
        {index}
      </span>
    </div>
  )
}
