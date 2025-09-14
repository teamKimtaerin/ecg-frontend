'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import type { RendererConfig } from '@/app/shared/motiontext'
import VideoPlayer from './VideoPlayer'
import EditorMotionTextOverlay from './EditorMotionTextOverlay'
import TextInsertionOverlay from './TextInsertion/TextInsertionOverlay'
import TextEditInput from './TextInsertion/TextEditInput'
import { useEditorStore } from '../store'
import { playbackEngine } from '@/utils/timeline/playbackEngine'
import { timelineEngine } from '@/utils/timeline/timelineEngine'
// import ScenarioJsonEditor from './ScenarioJsonEditor' // TODO: Re-enable when needed

interface VideoSectionProps {
  width?: number
}

const VideoSection: React.FC<VideoSectionProps> = ({ width = 300 }) => {
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const videoPlayerRef = useRef<HTMLVideoElement>(null)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentScenario, setCurrentScenario] = useState<RendererConfig | null>(
    null
  )
  const [scenarioOverride, setScenarioOverride] =
    useState<RendererConfig | null>(null)

  // Text insertion state
  const [currentTime, setCurrentTime] = useState(0)

  // Store hooks
  const {
    clips,
    timeline,
    initializeTimeline,
    setPlaybackPosition,
    videoUrl,
  } = useEditorStore()

  const handleScenarioUpdate = useCallback((scenario: RendererConfig) => {
    setCurrentScenario(scenario)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleScenarioApply = useCallback((newScenario: RendererConfig) => {
    console.log('[VideoSection] Applying new scenario:', newScenario)
    setScenarioOverride(newScenario)
  }, [])

  // 타임라인 초기화
  useEffect(() => {
    if (clips.length > 0 && timeline.clips.length === 0) {
      // 원본 클립들로부터 타임라인 초기화
      initializeTimeline(clips)
      
      // 재생 엔진 초기화
      const timelineClips = timelineEngine.initializeFromClips(clips)
      playbackEngine.initialize(timelineClips, clips)
    }
  }, [clips, timeline.clips.length, initializeTimeline])

  // 비디오 플레이어 레퍼런스 설정
  useEffect(() => {
    if (videoPlayerRef.current) {
      playbackEngine.setVideoPlayer(videoPlayerRef.current)
    }
  }, [videoUrl])

  // Handle time update from video player
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time)
    
    // 타임라인 재생 위치 업데이트
    setPlaybackPosition(time)
    playbackEngine.setCurrentTime(time)
  }, [setPlaybackPosition])

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
            ref={videoPlayerRef}
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
