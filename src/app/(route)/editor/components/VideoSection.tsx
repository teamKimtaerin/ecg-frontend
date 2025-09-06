'use client'

import React from 'react'
import VideoPlayer from './VideoPlayer'

interface VideoSectionProps {
  width?: number
}

const VideoSection: React.FC<VideoSectionProps> = ({ width = 300 }) => {
  return (
    <div
      className="bg-gray-900 p-4 flex-shrink-0"
      style={{ width: `${width}px` }}
    >
      <div
        className="bg-black rounded-lg mb-4 relative"
        style={{ aspectRatio: '16/9' }}
      >
        <VideoPlayer className="w-full h-full" />
      </div>
    </div>
  )
}

export default VideoSection
