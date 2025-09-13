'use client'

import React, { useRef, useState, useCallback } from 'react'
import type { RendererConfig } from '@/app/shared/motiontext'
import VideoPlayer from './VideoPlayer'
import EditorMotionTextOverlay from './EditorMotionTextOverlay'
import TextInsertionOverlay from './TextInsertion/TextInsertionOverlay'
import TextEditInput from './TextInsertion/TextEditInput'
// import ScenarioJsonEditor from './ScenarioJsonEditor' // TODO: Re-enable when needed

interface VideoSectionProps {
  width?: number
}

const VideoSection: React.FC<VideoSectionProps> = ({ width = 300 }) => {
  const videoContainerRef = useRef<HTMLDivElement>(null)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentScenario, setCurrentScenario] = useState<RendererConfig | null>(
    null
  )
  const [scenarioOverride, setScenarioOverride] =
    useState<RendererConfig | null>(null)

  // Text insertion state
  const [currentTime, setCurrentTime] = useState(0)

  const handleScenarioUpdate = useCallback((scenario: RendererConfig) => {
    setCurrentScenario(scenario)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleScenarioApply = useCallback((newScenario: RendererConfig) => {
    console.log('[VideoSection] Applying new scenario:', newScenario)
    setScenarioOverride(newScenario)
  }, [])

  // Handle time update from video player
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  // Handle text click for selection
  const handleTextClick = useCallback((textId: string) => {
    console.log('📱 VideoSection handleTextClick:', textId)
    // Text selection is handled by the TextInsertionOverlay component
  }, [])

  // Handle text double-click (disabled)
  const handleTextDoubleClick = useCallback((textId: string) => {
    console.log('📱 VideoSection handleTextDoubleClick:', textId)
    // Double click functionality disabled
  }, [])

  return (
    <div
      className="bg-white flex-shrink-0 h-full flex flex-col border-r border-gray-200"
      style={{ width: `${width}px` }}
    >
      {/* Video Player Container */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Video Player with Subtitles */}
        <div
          ref={videoContainerRef}
          className="bg-black rounded-lg mb-4 relative flex-shrink-0 overflow-hidden"
          style={{ aspectRatio: '16/9' }}
        >
          <VideoPlayer
            className="w-full h-full rounded-lg overflow-hidden"
            onTimeUpdate={handleTimeUpdate}
          />
          {/* MotionText overlay (legacy HTML overlay removed) */}
          <EditorMotionTextOverlay
            videoContainerRef={videoContainerRef}
            onScenarioUpdate={handleScenarioUpdate}
            scenarioOverride={scenarioOverride || undefined}
          />

          {/* Text Insertion Overlay */}
          <TextInsertionOverlay
            videoContainerRef={videoContainerRef}
            currentTime={currentTime}
            onTextClick={handleTextClick}
            onTextDoubleClick={handleTextDoubleClick}
          />
        </div>

        {/* Text Edit Input Panel */}
        <TextEditInput />
      </div>
    </div>
  )
}

export default VideoSection
