'use client'

import React from 'react'
import VideoPlayer from '@/components/VideoPlayer'

const VideoSection: React.FC = () => {
  return (
    <div className="w-[300px] bg-gray-900 p-4 border-r border-gray-700">
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
