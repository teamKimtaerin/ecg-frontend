'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import type { RendererConfigV2 as RendererConfig } from '@/app/shared/motiontext'
import VideoPlayer from './VideoPlayer'
import { useEditorStore } from '../store'
import EditorMotionTextOverlay from './EditorMotionTextOverlay'
import TextInsertionOverlay from './TextInsertion/TextInsertionOverlay'
import TextEditInput from './TextInsertion/TextEditInput'
import ScenarioJsonEditor from './ScenarioJsonEditor'
import VirtualTimelineController from './VirtualTimelineController'
import ChatBotFloatingButton from './ChatBot/ChatBotFloatingButton'
import ChatBotModal from './ChatBot/ChatBotModal'
import { ChatMessage } from '../types/chatBot'
import { playbackEngine } from '@/utils/timeline/playbackEngine'
import { timelineEngine } from '@/utils/timeline/timelineEngine'
import {
  VirtualPlayerController,
  type MotionTextSeekCallback,
} from '@/utils/virtual-timeline/VirtualPlayerController'
import { ECGTimelineMapper } from '@/utils/virtual-timeline/ECGTimelineMapper'
import { VirtualTimelineManager } from '@/utils/virtual-timeline/VirtualTimeline'

interface VideoSectionProps {
  width?: number
}

const VideoSection: React.FC<VideoSectionProps> = ({ width = 300 }) => {
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const videoPlayerRef = useRef<HTMLVideoElement>(null)

  const [currentScenario, setCurrentScenario] = useState<RendererConfig | null>(
    null
  )
  const [scenarioOverride, setScenarioOverride] =
    useState<RendererConfig | null>(null)

  // Text insertion state
  const [currentTime, setCurrentTime] = useState(0) // 가상 타임라인 시간
  const [realVideoTime, setRealVideoTime] = useState(0) // 실제 영상 시간 (텍스트 삽입용)

  // ChatBot state
  const [isChatBotOpen, setIsChatBotOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isChatBotTyping, setIsChatBotTyping] = useState(false)

  // Virtual Timeline 시스템
  const virtualTimelineManagerRef = useRef<VirtualTimelineManager | null>(null)
  const ecgTimelineMapperRef = useRef<ECGTimelineMapper | null>(null)
  const virtualPlayerControllerRef = useRef<VirtualPlayerController | null>(
    null
  )

  // Store hooks
  const {
    clips,
    timeline,
    initializeTimeline,
    setPlaybackPosition,
    videoUrl,
    videoDuration,
  } = useEditorStore()

  const handleScenarioUpdate = useCallback((scenario: RendererConfig) => {
    setCurrentScenario(scenario)
  }, [])

  const handleScenarioApply = useCallback((newScenario: RendererConfig) => {
    // Update store's scenario for ongoing sync
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = useEditorStore.getState() as any
    store.setScenarioFromJson?.(newScenario)
    // Also push as override for immediate apply
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

      // 클립 생성 시 duration이 0이면 videoDuration 또는 비디오 실제 duration 사용
      const clipsWithDuration = clips.map((clip) => {
        // 모든 단어의 타이밍이 0이거나 duration이 없는 경우
        const hasValidTiming = clip.words.some((word) => word.end > 0)
        if (!hasValidTiming && videoDuration && videoDuration > 0) {
          // 균등하게 시간 분배
          const avgDurationPerClip = (videoDuration || 0) / clips.length
          const clipIndex = clips.indexOf(clip)
          const startTime = clipIndex * avgDurationPerClip

          return {
            ...clip,
            words: clip.words.map((word, idx) => ({
              ...word,
              start: startTime + idx * (avgDurationPerClip / clip.words.length),
              end:
                startTime +
                (idx + 1) * (avgDurationPerClip / clip.words.length),
            })),
          }
        }
        return clip
      })

      // Virtual Timeline 재초기화
      ecgTimelineMapperRef.current.initialize(clipsWithDuration)

      // Virtual Player Controller에 타임라인 변경 알림
      if (virtualPlayerControllerRef.current) {
        const timeline =
          ecgTimelineMapperRef.current.timelineManager.getTimeline()
        console.log('📊 [VideoSection] Timeline segments:', {
          total: timeline.segments.length,
          enabled: timeline.segments.filter((s) => s.isEnabled).length,
          duration: timeline.duration,
          videoDuration: videoDuration || 0,
          usingFallback:
            timeline.duration === 0 && videoDuration && videoDuration > 0,
        })

        // duration이 0이면 비디오의 실제 duration 사용
        if (timeline.duration === 0 && videoDuration && videoDuration > 0) {
          console.log(
            '⚠️ [VideoSection] Timeline duration is 0, using video duration:',
            videoDuration
          )
        }

        // 새로운 handleTimelineUpdate 메서드 사용
        virtualPlayerControllerRef.current.handleTimelineUpdate(timeline)
      }
    }
  }, [clips, videoDuration]) // 클립이나 비디오 duration이 변경될 때마다 실행

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
        // 가상 타임라인 시간은 자막 렌더링용으로만 사용
        setCurrentTime(virtualTime)
        // 실제 영상 시간은 별도로 관리하여 텍스트 삽입에서 중복 렌더링 방지
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
      // 실제 영상 시간만 업데이트 (텍스트 삽입용)
      setRealVideoTime(time)

      // 가상 타임라인이 비활성화된 경우에만 currentTime도 업데이트
      if (!virtualPlayerControllerRef.current) {
        setCurrentTime(time)
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

  // ChatBot handlers
  const handleChatBotOpen = useCallback(() => {
    setIsChatBotOpen(true)
  }, [])

  const handleChatBotClose = useCallback(() => {
    setIsChatBotOpen(false)
  }, [])

  const handleSendMessage = useCallback((message: string) => {
    try {
      // Add user message
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        content: message,
        sender: 'user',
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, userMessage])

      // Simulate bot typing
      setIsChatBotTyping(true)

      // Simulate bot response (replace with actual AI integration later)
      setTimeout(() => {
        try {
          const botMessage: ChatMessage = {
            id: `bot_${Date.now()}`,
            content:
              '안녕하세요! 현재 UI만 구현된 상태입니다. 실제 AI 응답 기능은 추후 추가될 예정입니다.',
            sender: 'bot',
            timestamp: new Date(),
          }
          setChatMessages((prev) => [...prev, botMessage])
          setIsChatBotTyping(false)
        } catch (error) {
          console.error('Error in bot response:', error)
          setIsChatBotTyping(false)
        }
      }, 1500)
    } catch (error) {
      console.error('Error in handleSendMessage:', error)
      setIsChatBotTyping(false)
    }
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

          {/* Text Insertion Overlay - 실제 영상 시간만 사용 */}
          <TextInsertionOverlay
            videoContainerRef={videoContainerRef}
            currentTime={realVideoTime}
            onTextClick={handleTextClick}
            onTextDoubleClick={handleTextDoubleClick}
          />
        </div>

        {/* Virtual Timeline Controller - Hidden */}
        {/* <div className="mb-4">
          <VirtualTimelineController
            virtualPlayerController={virtualPlayerControllerRef.current}
          />
        </div> */}

        {/* Text Edit Input Panel */}
        <TextEditInput />

        {/* Scenario JSON Editor - Show only when DEBUG_UI is enabled */}
        {process.env.NEXT_PUBLIC_DEBUG_UI === 'true' && currentScenario && (
          <ScenarioJsonEditor
            initialScenario={currentScenario}
            onApply={handleScenarioApply}
            className="mt-3"
          />
        )}
      </div>

      {/* ChatBot Floating Button */}
      <div className="absolute bottom-4 right-4 z-30">
        <ChatBotFloatingButton onClick={handleChatBotOpen} />
      </div>

      {/* ChatBot Modal */}
      <ChatBotModal
        isOpen={isChatBotOpen}
        onClose={handleChatBotClose}
        messages={chatMessages}
        isTyping={isChatBotTyping}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}

// Cleanup on unmount
VideoSection.displayName = 'VideoSection'

export default VideoSection
