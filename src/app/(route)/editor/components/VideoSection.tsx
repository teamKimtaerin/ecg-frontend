'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import type { RendererConfig } from '@/app/shared/motiontext'
import VideoPlayer from './VideoPlayer'
import EditorMotionTextOverlay from './EditorMotionTextOverlay'
import TextInsertionOverlay from './TextInsertion/TextInsertionOverlay'
import TextEditInput from './TextInsertion/TextEditInput'
import VirtualTimelineVideoController from './VirtualTimelineVideoController'
import { useEditorStore } from '../store'
import { playbackEngine } from '@/utils/timeline/playbackEngine'
import { timelineEngine } from '@/utils/timeline/timelineEngine'
import {
  VirtualPlayerController,
  type MotionTextSeekCallback,
} from '@/utils/virtual-timeline/VirtualPlayerController'
import { ECGTimelineMapper } from '@/utils/virtual-timeline/ECGTimelineMapper'
import { VirtualTimelineManager } from '@/utils/virtual-timeline/VirtualTimeline'
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

  // Virtual Timeline 시스템
  const virtualTimelineManagerRef = useRef<VirtualTimelineManager | null>(null)
  const ecgTimelineMapperRef = useRef<ECGTimelineMapper | null>(null)
  const virtualPlayerControllerRef = useRef<VirtualPlayerController | null>(
    null
  )

  // Store hooks
  const { clips, timeline, initializeTimeline, setPlaybackPosition, videoUrl } =
    useEditorStore()

  const handleScenarioUpdate = useCallback((scenario: RendererConfig) => {
    setCurrentScenario(scenario)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleScenarioApply = useCallback((newScenario: RendererConfig) => {
    console.log('[VideoSection] Applying new scenario:', newScenario)
    setScenarioOverride(newScenario)
  }, [])

  // Virtual Timeline 시스템 초기화 (한 번만 실행)
  useEffect(() => {
    // Virtual Timeline Manager 초기화
    if (!virtualTimelineManagerRef.current) {
      virtualTimelineManagerRef.current = new VirtualTimelineManager({
        debugMode: true, // 개발 중에는 디버그 모드 활성화
      })
    }

    // ECG Timeline Mapper 초기화
    if (!ecgTimelineMapperRef.current) {
      ecgTimelineMapperRef.current = new ECGTimelineMapper(
        virtualTimelineManagerRef.current
      )
    }

    // Virtual Player Controller 초기화
    if (!virtualPlayerControllerRef.current) {
      virtualPlayerControllerRef.current = new VirtualPlayerController(
        ecgTimelineMapperRef.current,
        {
          debugMode: true,
          enableFramePrecision: true,
        }
      )
    }

    // 기존 타임라인 초기화 (호환성 유지)
    if (timeline.clips.length === 0 && clips.length > 0) {
      initializeTimeline(clips)
      const timelineClips = timelineEngine.initializeFromClips(clips)
      playbackEngine.initialize(timelineClips, clips)
    }
  }, [timeline.clips, clips, initializeTimeline]) // Dependencies needed for initialization logic

  // 클립 변경사항을 Virtual Timeline에 반영
  useEffect(() => {
    if (ecgTimelineMapperRef.current && clips.length >= 0) {
      console.log(
        '🔄 [VideoSection] Updating Virtual Timeline with clips:',
        clips.length
      )

      // Virtual Timeline 재초기화
      ecgTimelineMapperRef.current.initialize(clips)

      // Virtual Player Controller에 타임라인 변경 알림
      if (virtualPlayerControllerRef.current) {
        const timeline =
          ecgTimelineMapperRef.current.timelineManager.getTimeline()
        console.log('📊 [VideoSection] Timeline segments:', {
          total: timeline.segments.length,
          enabled: timeline.segments.filter((s) => s.isEnabled).length,
          duration: timeline.duration,
        })

        // 새로운 handleTimelineUpdate 메서드 사용
        virtualPlayerControllerRef.current.handleTimelineUpdate(timeline)
      }
    }
  }, [clips]) // 클립이 변경될 때마다 실행

  // 비디오 플레이어 레퍼런스 설정
  useEffect(() => {
    if (videoPlayerRef.current) {
      // 기존 PlaybackEngine 설정 (호환성 유지)
      playbackEngine.setVideoPlayer(videoPlayerRef.current)

      // Virtual Player Controller에 비디오 연결
      if (virtualPlayerControllerRef.current) {
        virtualPlayerControllerRef.current.attachVideo(videoPlayerRef.current)
      }
    }
  }, [videoUrl])

  // MotionText Renderer 연동을 위한 콜백 설정
  useEffect(() => {
    if (virtualPlayerControllerRef.current) {
      // MotionText Renderer의 seek 함수를 콜백으로 등록
      const motionTextSeekCallback: MotionTextSeekCallback = (
        virtualTime: number
      ) => {
        // EditorMotionTextOverlay의 MotionText Renderer에 Virtual Time 전달
        // 현재는 currentTime 상태로 전달하지만, 직접 MotionText Renderer API 호출도 가능
        setCurrentTime(virtualTime)
      }

      const cleanup = virtualPlayerControllerRef.current.onMotionTextSeek(
        motionTextSeekCallback
      )

      return cleanup
    }
  }, []) // virtualPlayerControllerRef.current is stable

  // Handle time update from video player
  const handleTimeUpdate = useCallback(
    (time: number) => {
      setCurrentTime(time)

      // Virtual Timeline 시스템이 활성화된 경우 Virtual Player Controller에서 자동 처리
      // 그렇지 않으면 기존 playbackEngine 사용
      if (!virtualPlayerControllerRef.current) {
        // 타임라인 재생 위치 업데이트 (기존 시스템)
        setPlaybackPosition(time)
        playbackEngine.setCurrentTime(time)
      }
      // Virtual Player Controller가 있으면 RVFC가 자동으로 시간 업데이트 처리
    },
    [setPlaybackPosition]
  )

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

        {/* Virtual Timeline Video Controller */}
        <div className="mb-4">
          <VirtualTimelineVideoController
            virtualPlayerController={virtualPlayerControllerRef.current}
            onVirtualTimeUpdate={(virtualTime, duration) => {
              console.log('Virtual time update:', virtualTime, duration)
              // Virtual Time은 이미 RVFC 콜백을 통해 자동으로 MotionText Renderer에 전달됨
            }}
            showSegmentVisualization={true}
            showVolumeControls={true}
            className="rounded-lg border border-gray-200 bg-white shadow-sm"
          />
        </div>

        {/* Text Edit Input Panel */}
        <TextEditInput />
      </div>
    </div>
  )
}

// Cleanup on unmount
VideoSection.displayName = 'VideoSection'

// Virtual Timeline 정리 함수 (현재 사용하지 않음)
// const cleanupVirtualTimeline = (
//   virtualPlayerControllerRef: React.MutableRefObject<VirtualPlayerController | null>
// ) => {
//   if (virtualPlayerControllerRef.current) {
//     virtualPlayerControllerRef.current.cleanup()
//     virtualPlayerControllerRef.current = null
//   }
// }

export default VideoSection
