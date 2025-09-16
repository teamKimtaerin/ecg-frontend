'use client'

import React, { useRef, useState, useCallback } from 'react'
import type { RendererConfig } from '@/app/shared/motiontext'
import VideoPlayer from './VideoPlayer'
import EditorMotionTextOverlay from './EditorMotionTextOverlay'
import ScenarioJsonEditor from './ScenarioJsonEditor'

interface VideoSectionProps {
  width?: number
}

const VideoSection: React.FC<VideoSectionProps> = ({ width = 300 }) => {
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const [currentScenario, setCurrentScenario] = useState<RendererConfig | null>(
    null
  )
  const [scenarioOverride, setScenarioOverride] =
    useState<RendererConfig | null>(null)

  const handleScenarioUpdate = useCallback((scenario: RendererConfig) => {
    setCurrentScenario(scenario)
  }, [])

  const handleScenarioApply = useCallback((newScenario: RendererConfig) => {
    console.log('[VideoSection] Applying new scenario:', newScenario)
    setScenarioOverride(newScenario)
  }, [])

  return (
    <div
      className="bg-gray-900 p-4 flex-shrink-0 h-full flex flex-col"
      style={{ width: `${width}px` }}
    >
      {/* Video Player with Subtitles */}
      <div
        ref={videoContainerRef}
        className="bg-black rounded-lg mb-4 relative flex-shrink-0 overflow-hidden"
        style={{ aspectRatio: '16/9' }}
      >
        <VideoPlayer className="w-full h-full rounded-lg overflow-hidden" />
        {/* MotionText overlay (legacy HTML overlay removed) */}
        <EditorMotionTextOverlay
          videoContainerRef={videoContainerRef}
          onScenarioUpdate={handleScenarioUpdate}
          scenarioOverride={scenarioOverride || undefined}
        />
      </div>

      {/* JSON Editor */}
      <ScenarioJsonEditor
        initialScenario={
          currentScenario || {
            version: '1.3',
            timebase: { unit: 'seconds' },
            stage: { baseAspect: '16:9' },
            tracks: [],
            cues: [],
          }
        }
        onApply={handleScenarioApply}
        className="flex-shrink-0"
      />
    </div>
  )
}

export default VideoSection
