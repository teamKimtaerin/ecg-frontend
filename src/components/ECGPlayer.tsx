'use client'

import React, { useEffect, useState } from 'react'
import { useVideo } from '@/contexts/VideoContext'

// ECG Player 컴포넌트
const ECGPlayer: React.FC = () => {
  const { videoUrl } = useVideo()
  const [CaptionWithIntention, setCaptionWithIntention] =
    useState<React.ComponentType<{
      videoSrc: string
      timingSyncSrc: string
      width: number
      height: number
      responsive: boolean
    }> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dynamic import ECG Player
  useEffect(() => {
    const loadECGPlayer = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 개발 환경에서 로컬 또는 npm 패키지를 조건부로 로드
        let ecgPlayerModule
        try {
          ecgPlayerModule = await import('ecg-player')
        } catch (localError) {
          console.warn('Failed to import ECG Player, retrying...', localError)
          // 재시도
          await new Promise((resolve) => setTimeout(resolve, 1000))
          ecgPlayerModule = await import('ecg-player')
        }

        setCaptionWithIntention(() => ecgPlayerModule.CaptionWithIntention)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load ECG Player:', error)
        setError('Failed to load ECG Player component')
        setIsLoading(false)
      }
    }

    loadECGPlayer()
  }, [])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <svg
            className="w-12 h-12 text-red-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-red-600 mb-2">Error loading ECG Player</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (isLoading || !CaptionWithIntention) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading ECG Player...</p>
        </div>
      </div>
    )
  }

  if (!videoUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-600 mb-2">No video loaded</p>
          <p className="text-sm text-gray-500">Upload a video to start</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <CaptionWithIntention
        videoSrc={videoUrl}
        timingSyncSrc="/sample/real.json"
        width={960}
        height={540}
        responsive={true}
      />
    </div>
  )
}

export default ECGPlayer
