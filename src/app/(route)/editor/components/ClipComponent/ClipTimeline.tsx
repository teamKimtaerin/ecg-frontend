import React from 'react'

interface ClipTimelineProps {
  index: number
}

export default function ClipTimeline({ index }: ClipTimelineProps) {
  return (
    <div className="absolute top-2 left-0 right-0 flex justify-center">
      <span className="text-base text-[#F2F2F2] font-mono font-bold">
        {index}
      </span>
    </div>
  )
}
