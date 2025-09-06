'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface VideoPlayerProps {
  src?: string
  className?: string
  poster?: string
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  className,
  poster,
}) => {
  return (
    <div
      className={cn('relative bg-black rounded-lg overflow-hidden', className)}
    >
      {src ? (
        <video
          className="w-full h-full object-cover"
          poster={poster}
          controls
          preload="metadata"
        >
          <source src={src} type="video/mp4" />
          <p className="text-white p-4">
            Your browser does not support the video tag.
          </p>
        </video>
      ) : (
        <div className="flex items-center justify-center w-full h-full text-gray-400">
          <div className="text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-10V3a1 1 0 011-1h4a1 1 0 011 1v1M7 7h10a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z"
              />
            </svg>
            <p className="text-sm">No video loaded</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoPlayer
