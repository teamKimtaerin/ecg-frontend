/**
 * Virtual Player Controller
 * RVFC 기반으로 Real Video Player와 Virtual Timeline을 연결하는 핵심 컨트롤러
 * MotionText Renderer와 연동하여 기존 자막 렌더링 시스템 활용
 */

import { log } from '@/utils/logger'
import { ECGTimelineMapper } from './ECGTimelineMapper'
import { VirtualSegmentController } from './VirtualSegmentController'
import {
  VirtualPlayerControl,
  VirtualPlayerEvents,
  VirtualFrameData,
  FrameCallback,
  PlayStateCallback,
  SeekCallback,
  TimeUpdateCallback,
  VirtualTimeline,
  VirtualTimelineConfig,
  VirtualSegment
} from './types'

// MotionText Renderer 연동을 위한 콜백 타입
export type MotionTextSeekCallback = (virtualTime: number) => void

interface RVFCMetadata {
  presentationTime: DOMHighResTimeStamp
  expectedDisplayTime: DOMHighResTimeStamp
  width: number
  height: number
  mediaTime: number
  presentedFrames: number
  processingDuration?: number
}

export class VirtualPlayerController implements VirtualPlayerControl, VirtualPlayerEvents {
  private video: HTMLVideoElement | null = null
  private timelineMapper: ECGTimelineMapper
  private config: VirtualTimelineConfig
  private segmentController: VirtualSegmentController

  // Event callbacks
  private frameCallbacks: Set<FrameCallback> = new Set()
  private playCallbacks: Set<PlayStateCallback> = new Set()
  private pauseCallbacks: Set<PlayStateCallback> = new Set()
  private stopCallbacks: Set<PlayStateCallback> = new Set()
  private seekCallbacks: Set<SeekCallback> = new Set()
  private timeUpdateCallbacks: Set<TimeUpdateCallback> = new Set()
  private timelineChangeCallbacks: Set<(timeline: VirtualTimeline) => void> = new Set()
  
  // MotionText Renderer 연동 콜백
  private motionTextSeekCallbacks: Set<MotionTextSeekCallback> = new Set()

  // State
  private isRVFCActive: boolean = false
  private currentVirtualTime: number = 0
  private isPlaying: boolean = false
  private playbackRate: number = 1.0
  private lastFrameTime: number = 0
  private frameCount: number = 0

  // RVFC handle for cleanup
  private rvfcHandle: number | null = null

  // Frame processing debouncing
  private frameProcessingDebounceMs: number = 16 // ~60fps limit
  
  // Continuous virtual time progression
  private virtualTimeStartTimestamp: number = 0 // 가상 시간 시작 기준점
  private virtualTimePausedAt: number = 0 // 일시정지된 가상 시간
  private isVirtualTimeRunning: boolean = false // 가상 시간 진행 상태
  
  // Current active segment tracking
  private currentActiveSegment: VirtualSegment | null = null
  private lastVirtualTimeProcessed: number = -1

  constructor(
    timelineMapper: ECGTimelineMapper,
    config: Partial<VirtualTimelineConfig> = {}
  ) {
    this.timelineMapper = timelineMapper
    this.config = {
      enableFramePrecision: true,
      frameRate: 30,
      bufferSize: 10,
      syncThreshold: 16.67,
      debugMode: false,
      ...config
    }

    // VirtualSegmentController 초기화
    this.segmentController = new VirtualSegmentController({
      boundaryThreshold: 0.05, // 50ms
      debounceTime: 100, // 100ms
      debugMode: this.config.debugMode
    })

    // 세그먼트 완료 콜백 등록
    this.segmentController.onPlaybackComplete(() => {
      this.pauseAtEnd()
    })

    log('VirtualPlayerController', 'Initialized with config:', this.config)
  }

  /**
   * HTML5 video element 연결
   */
  attachVideo(video: HTMLVideoElement): void {
    if (this.video) {
      this.detachVideo()
    }

    this.video = video
    this.setupVideoEventListeners()
    this.startRVFC()

    log('VirtualPlayerController', 'Video attached and RVFC started')
  }

  /**
   * Video element 연결 해제
   */
  detachVideo(): void {
    if (this.video) {
      this.stopRVFC()
      this.removeVideoEventListeners()
      this.video = null
      log('VirtualPlayerController', 'Video detached')
    }
  }

  // VirtualPlayerControl 구현

  async play(): Promise<void> {
    if (!this.video) {
      throw new Error('Video not attached')
    }

    try {
      // 가상 시간 진행 시작
      this.startVirtualTimeProgression()
      this.isPlaying = true
      this.notifyPlayCallbacks()
      log('VirtualPlayerController', 'Virtual Timeline playback started')
    } catch (error) {
      log('VirtualPlayerController', 'Play failed:', error)
      throw error
    }
  }

  pause(): void {
    if (!this.video) return

    // 가상 시간 진행 일시정지
    this.pauseVirtualTimeProgression()
    this.video.pause()
    this.isPlaying = false
    this.notifyPauseCallbacks()
    log('VirtualPlayerController', 'Playback paused')
  }

  stop(): void {
    if (!this.video) return

    // 가상 시간 진행 중지 및 초기화
    this.stopVirtualTimeProgression()
    this.video.pause()
    this.isPlaying = false
    this.currentVirtualTime = 0
    this.currentActiveSegment = null
    this.lastVirtualTimeProcessed = -1
    this.notifyStopCallbacks()
    log('VirtualPlayerController', 'Playback stopped')
  }

  seek(virtualTime: number): void {
    if (!this.video) return

    // 가상 시간 직접 설정
    this.currentVirtualTime = Math.max(0, Math.min(virtualTime, this.getDuration()))
    
    // 가상 시간 진행 상태 업데이트 (seek 시 현재 위치 기준으로 재설정)
    if (this.isVirtualTimeRunning) {
      this.virtualTimePausedAt = this.currentVirtualTime
      this.virtualTimeStartTimestamp = performance.now()
    }
    
    // 현재 가상 시간에 해당하는 세그먼트 찾기 및 비디오 위치 설정
    this.updateVideoPositionFromVirtualTime()
    
    this.notifySeekCallbacks(this.currentVirtualTime)
    this.notifyTimeUpdateCallbacks(this.currentVirtualTime)
    this.notifyMotionTextSeekCallbacks(this.currentVirtualTime)
    
    log('VirtualPlayerController', `Seeked to virtual time: ${this.currentVirtualTime.toFixed(3)}s`)
  }

  getCurrentTime(): number {
    return this.currentVirtualTime
  }

  getDuration(): number {
    const timeline = this.timelineMapper.timelineManager.getTimeline()
    return timeline.duration
  }

  setPlaybackRate(rate: number): void {
    if (!this.video) return

    this.video.playbackRate = rate
    this.playbackRate = rate
    log('VirtualPlayerController', `Playback rate set to: ${rate}`)
  }

  getPlaybackRate(): number {
    return this.playbackRate
  }

  // VirtualPlayerEvents 구현

  onFrame(callback: FrameCallback): () => void {
    this.frameCallbacks.add(callback)
    return () => this.frameCallbacks.delete(callback)
  }

  onPlay(callback: PlayStateCallback): () => void {
    this.playCallbacks.add(callback)
    return () => this.playCallbacks.delete(callback)
  }

  onPause(callback: PlayStateCallback): () => void {
    this.pauseCallbacks.add(callback)
    return () => this.pauseCallbacks.delete(callback)
  }

  onStop(callback: PlayStateCallback): () => void {
    this.stopCallbacks.add(callback)
    return () => this.stopCallbacks.delete(callback)
  }

  onSeek(callback: SeekCallback): () => void {
    this.seekCallbacks.add(callback)
    return () => this.seekCallbacks.delete(callback)
  }

  onTimeUpdate(callback: TimeUpdateCallback): () => void {
    this.timeUpdateCallbacks.add(callback)
    return () => this.timeUpdateCallbacks.delete(callback)
  }

  onTimelineChange(callback: (timeline: VirtualTimeline) => void): () => void {
    this.timelineChangeCallbacks.add(callback)
    return () => this.timelineChangeCallbacks.delete(callback)
  }

  /**
   * 타임라인 변경 시 호출되는 핸들러 (VideoSection에서 직접 호출)
   */
  handleTimelineUpdate(timeline: VirtualTimeline): void {
    if (this.config.debugMode) {
      log('VirtualPlayerController', 
        `Timeline updated: ${timeline.segments.filter(s => s.isEnabled).length} active segments of ${timeline.segments.length} total`)
    }

    // 세그먼트 컨트롤러에 새로운 타임라인 설정
    this.segmentController.setTimeline(timeline)

    // 현재 Virtual Time을 새로운 타임라인에 맞게 조정
    if (this.currentVirtualTime > timeline.duration) {
      this.currentVirtualTime = Math.min(this.currentVirtualTime, timeline.duration)
      log('VirtualPlayerController', `Adjusted virtual time to ${this.currentVirtualTime} due to timeline shrinkage`)
    }

    // 현재 재생 중이고 유효하지 않은 위치에 있다면 조정
    if (this.video) {
      const currentRealTime = this.video.currentTime
      
      if (!this.isWithinValidSegment(currentRealTime)) {
        if (this.isPlaying) {
          // 재생 중이면 세그먼트 컨트롤러를 통해 처리
          const result = this.segmentController.processCurrentTime(currentRealTime)
          if (result.needsTransition && result.targetTime !== undefined) {
            this.video.currentTime = result.targetTime
          }
        } else {
          // 일시정지 중이면 첫 번째 유효한 세그먼트로 이동
          this.moveToFirstValidSegment()
        }
      }
    }

    // 모든 타임라인 변경 콜백 호출
    this.timelineChangeCallbacks.forEach(callback => {
      try {
        callback(timeline)
      } catch (error) {
        log('VirtualPlayerController', 'Timeline change callback error:', error)
      }
    })

    // 상태 초기화 (새로운 타임라인이므로)
    this.lastVirtualTimeProcessed = -1
  }

  /**
   * 첫 번째 유효한 세그먼트로 이동 (일시정지 상태에서)
   */
  private moveToFirstValidSegment(): void {
    if (!this.video) return

    const timeline = this.timelineMapper.timelineManager.getTimeline()
    const firstSegment = timeline.segments
      .filter(segment => segment.isEnabled)
      .sort((a, b) => a.realStartTime - b.realStartTime)[0]
    
    if (firstSegment) {
      this.video.currentTime = firstSegment.realStartTime
      const mapping = this.timelineMapper.toVirtual(firstSegment.realStartTime)
      if (mapping.isValid) {
        this.currentVirtualTime = mapping.virtualTime
        this.notifyTimeUpdateCallbacks(this.currentVirtualTime)
        this.notifyMotionTextSeekCallbacks(this.currentVirtualTime)
      }
      
      if (this.config.debugMode) {
        log('VirtualPlayerController', 
          `Moved to first valid segment: ${firstSegment.realStartTime.toFixed(3)}s`)
      }
    }
  }

  /**
   * MotionText Renderer seek 콜백 등록
   */
  onMotionTextSeek(callback: MotionTextSeekCallback): () => void {
    this.motionTextSeekCallbacks.add(callback)
    return () => this.motionTextSeekCallbacks.delete(callback)
  }

  // RVFC 관리

  private startRVFC(): void {
    if (!this.video || this.isRVFCActive) return

    this.isRVFCActive = true
    this.scheduleNextFrame()
    log('VirtualPlayerController', 'RVFC started')
  }

  private stopRVFC(): void {
    if (this.rvfcHandle !== null) {
      this.video?.cancelVideoFrameCallback?.(this.rvfcHandle)
      this.rvfcHandle = null
    }
    this.isRVFCActive = false
    log('VirtualPlayerController', 'RVFC stopped')
  }

  private scheduleNextFrame(): void {
    if (!this.video || !this.isRVFCActive) return

    // Check if requestVideoFrameCallback is available
    if (typeof this.video.requestVideoFrameCallback !== 'function') {
      // Fallback to requestAnimationFrame for browsers without RVFC support
      this.fallbackToRAF()
      return
    }

    this.rvfcHandle = this.video.requestVideoFrameCallback((now, metadata) => {
      this.handleVideoFrame(now, metadata as RVFCMetadata)
      this.scheduleNextFrame()
    })
  }

  private fallbackToRAF(): void {
    log('VirtualPlayerController', 'RVFC not supported, falling back to RAF')
    
    const rafCallback = (timestamp: DOMHighResTimeStamp) => {
      if (this.video && this.isRVFCActive) {
        // Create synthetic metadata for RAF fallback
        const syntheticMetadata: RVFCMetadata = {
          presentationTime: timestamp,
          expectedDisplayTime: timestamp,
          width: this.video.videoWidth,
          height: this.video.videoHeight,
          mediaTime: this.video.currentTime,
          presentedFrames: this.frameCount++,
          processingDuration: 0
        }

        this.handleVideoFrame(timestamp, syntheticMetadata)
        requestAnimationFrame(rafCallback)
      }
    }

    requestAnimationFrame(rafCallback)
  }

  private handleVideoFrame(now: DOMHighResTimeStamp, metadata: RVFCMetadata): void {
    if (!this.video) return

    // Frame rate limiting debouncing
    if (this.config.enableFramePrecision) {
      const timeSinceLastFrame = now - this.lastFrameTime
      if (timeSinceLastFrame < this.frameProcessingDebounceMs) {
        return // Skip frame to maintain target frame rate
      }
    }
    
    // 연속적인 가상 시간 진행 업데이트
    this.updateContinuousVirtualTime(now)
    
    // 가상 시간이 총 길이를 초과하면 재생 완료
    const totalDuration = this.getDuration()
    if (this.currentVirtualTime >= totalDuration) {
      this.pauseAtEnd()
      return
    }
    
    // 현재 가상 시간에서 활성 세그먼트 찾기
    const activeSegment = this.findActiveSegmentAtVirtualTime(this.currentVirtualTime)
    
    // 세그먼트 변경 감지
    if (activeSegment !== this.currentActiveSegment) {
      this.handleSegmentChange(activeSegment)
    }
    
    // 세그먼트에 따른 비디오 위치 업데이트
    this.updateVideoPositionFromVirtualTime()

    // Create virtual frame data with current active segments
    const frameData = this.timelineMapper.createVirtualFrameData(
      this.currentVirtualTime,
      this.video.currentTime,
      metadata.expectedDisplayTime
    )

    // Notify all frame callbacks
    this.notifyFrameCallbacks(frameData)

    // Update time callbacks
    this.notifyTimeUpdateCallbacks(this.currentVirtualTime)

    // MotionText Renderer에 Virtual Time 전달
    this.notifyMotionTextSeekCallbacks(this.currentVirtualTime)

    // Update frame processing state
    this.lastFrameTime = now
    this.lastVirtualTimeProcessed = this.currentVirtualTime
    this.frameCount++

    if (this.config.debugMode && this.frameCount % 30 === 0) {
      log('VirtualPlayerController', 
        `Frame ${this.frameCount}: virtual=${this.currentVirtualTime.toFixed(3)}s, ` +
        `segment=${activeSegment?.id || 'none'}, ` +
        `video=${this.video.currentTime.toFixed(3)}s`)
    }
  }

  // Video event listeners

  private setupVideoEventListeners(): void {
    if (!this.video) return

    this.video.addEventListener('play', this.handleVideoPlay)
    this.video.addEventListener('pause', this.handleVideoPause)
    this.video.addEventListener('seeking', this.handleVideoSeeking)
    this.video.addEventListener('seeked', this.handleVideoSeeked)
    this.video.addEventListener('ended', this.handleVideoEnded)
    this.video.addEventListener('error', this.handleVideoError)
  }

  private removeVideoEventListeners(): void {
    if (!this.video) return

    this.video.removeEventListener('play', this.handleVideoPlay)
    this.video.removeEventListener('pause', this.handleVideoPause)
    this.video.removeEventListener('seeking', this.handleVideoSeeking)
    this.video.removeEventListener('seeked', this.handleVideoSeeked)
    this.video.removeEventListener('ended', this.handleVideoEnded)
    this.video.removeEventListener('error', this.handleVideoError)
  }

  private handleVideoPlay = (): void => {
    this.isPlaying = true
    this.notifyPlayCallbacks()
  }

  private handleVideoPause = (): void => {
    this.isPlaying = false
    this.notifyPauseCallbacks()
  }

  private handleVideoSeeking = (): void => {
    if (this.config.debugMode) {
      log('VirtualPlayerController', 'Video seeking started')
    }
  }

  private handleVideoSeeked = (): void => {
    if (!this.video) return

    const mapping = this.timelineMapper.toVirtual(this.video.currentTime)
    if (mapping.isValid) {
      this.currentVirtualTime = mapping.virtualTime
      this.notifySeekCallbacks(mapping.virtualTime)
    }
  }

  private handleVideoEnded = (): void => {
    this.isPlaying = false
    this.notifyStopCallbacks()
    log('VirtualPlayerController', 'Video ended')
  }

  private handleVideoError = (event: Event): void => {
    log('VirtualPlayerController', 'Video error:', event)
  }

  /**
   * Virtual Timeline 재생 시 유효한 시작 위치 보장
   */
  private ensureValidStartPosition(): void {
    if (!this.video) return

    const currentRealTime = this.video.currentTime
    
    // 현재 위치가 유효하지 않으면 첫 번째 유효한 세그먼트로 이동
    if (!this.isWithinValidSegment(currentRealTime)) {
      const timeline = this.timelineMapper.timelineManager.getTimeline()
      const firstSegment = timeline.segments
        .filter(segment => segment.isEnabled)
        .sort((a, b) => a.realStartTime - b.realStartTime)[0]
      
      if (firstSegment) {
        this.video.currentTime = firstSegment.realStartTime
        const mapping = this.timelineMapper.toVirtual(firstSegment.realStartTime)
        if (mapping.isValid) {
          this.currentVirtualTime = mapping.virtualTime
        }
        
        if (this.config.debugMode) {
          log('VirtualPlayerController', 
            `Starting Virtual Timeline at first segment: ${firstSegment.realStartTime.toFixed(3)}s`)
        }
      }
    }
  }

  /**
   * 현재 시간이 유효한 세그먼트 내에 있는지 확인
   */
  private isWithinValidSegment(realTime: number): boolean {
    const timeline = this.timelineMapper.timelineManager.getTimeline()
    
    return timeline.segments.some(segment => 
      segment.isEnabled && 
      realTime >= segment.realStartTime && 
      realTime <= segment.realEndTime
    )
  }


  /**
   * Virtual Timeline 재생 완료 시 정지 (연속적 가상 시간 모델용)
   */
  private pauseAtEnd(): void {
    if (!this.video) return
    
    // 가상 시간 진행 중지
    this.pauseVirtualTimeProgression()
    
    // 재생 상태 변경
    this.isPlaying = false
    this.video.pause()
    
    // Virtual Timeline의 총 재생 시간으로 설정
    const totalDuration = this.getDuration()
    this.currentVirtualTime = totalDuration
    
    // 활성 세그먼트 초기화
    this.currentActiveSegment = null
    
    // 모든 콜백에 재생 완료 알림
    this.notifyTimeUpdateCallbacks(this.currentVirtualTime)
    this.notifyMotionTextSeekCallbacks(this.currentVirtualTime)
    this.notifyPauseCallbacks()
    
    if (this.config.debugMode) {
      log('VirtualPlayerController', 
        `Virtual Timeline playback completed: virtual=${this.currentVirtualTime.toFixed(3)}s/${totalDuration.toFixed(3)}s`)
    }
    
    // Virtual Timeline 완료 이벤트 콜백 호출
    this.notifyVirtualTimelineComplete()
  }
  
  /**
   * Virtual Timeline 완료 이벤트 알림
   */
  private notifyVirtualTimelineComplete(): void {
    // Virtual Timeline 전용 완료 콜백이 있다면 여기서 호출
    // 현재는 pause 콜백을 재사용하지만, 필요에 따라 별도 콜백 타입 추가 가능
    if (this.config.debugMode) {
      log('VirtualPlayerController', 'Virtual Timeline completion event fired')
    }
  }


  /**
   * 주어진 Virtual Time과 가장 가까운 유효한 Virtual Time 찾기
   */
  private findNearestValidVirtualTime(targetVirtualTime: number): number | null {
    const timeline = this.timelineMapper.timelineManager.getTimeline()
    let nearestTime: number | null = null
    let minDistance = Infinity

    for (const segment of timeline.segments) {
      if (segment.isEnabled) {
        // 세그먼트 시작점과의 거리 계산
        const startDistance = Math.abs(segment.virtualStartTime - targetVirtualTime)
        if (startDistance < minDistance) {
          minDistance = startDistance
          nearestTime = segment.virtualStartTime
        }

        // 세그먼트 끝점과의 거리 계산
        const endDistance = Math.abs(segment.virtualEndTime - targetVirtualTime)
        if (endDistance < minDistance) {
          minDistance = endDistance
          nearestTime = segment.virtualEndTime
        }
      }
    }

    return nearestTime
  }

  // Callback notification methods

  private notifyFrameCallbacks(frameData: VirtualFrameData): void {
    this.frameCallbacks.forEach(callback => {
      try {
        callback(frameData)
      } catch (error) {
        log('VirtualPlayerController', 'Frame callback error:', error)
      }
    })
  }

  private notifyPlayCallbacks(): void {
    this.playCallbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        log('VirtualPlayerController', 'Play callback error:', error)
      }
    })
  }

  private notifyPauseCallbacks(): void {
    this.pauseCallbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        log('VirtualPlayerController', 'Pause callback error:', error)
      }
    })
  }

  private notifyStopCallbacks(): void {
    this.stopCallbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        log('VirtualPlayerController', 'Stop callback error:', error)
      }
    })
  }

  private notifySeekCallbacks(virtualTime: number): void {
    this.seekCallbacks.forEach(callback => {
      try {
        callback(virtualTime)
      } catch (error) {
        log('VirtualPlayerController', 'Seek callback error:', error)
      }
    })
  }

  private notifyTimeUpdateCallbacks(virtualTime: number): void {
    this.timeUpdateCallbacks.forEach(callback => {
      try {
        callback(virtualTime)
      } catch (error) {
        log('VirtualPlayerController', 'Time update callback error:', error)
      }
    })
  }

  private notifyMotionTextSeekCallbacks(virtualTime: number): void {
    this.motionTextSeekCallbacks.forEach(callback => {
      try {
        callback(virtualTime)
      } catch (error) {
        log('VirtualPlayerController', 'MotionText seek callback error:', error)
      }
    })
  }

  /**
   * 리소스 정리
   */
  cleanup(): void {
    this.detachVideo()
    this.segmentController.dispose()
    this.frameCallbacks.clear()
    this.playCallbacks.clear()
    this.pauseCallbacks.clear()
    this.stopCallbacks.clear()
    this.seekCallbacks.clear()
    this.timeUpdateCallbacks.clear()
    this.timelineChangeCallbacks.clear()
    this.motionTextSeekCallbacks.clear()
    log('VirtualPlayerController', 'Cleaned up')
  }

  /**
   * 가상 시간 진행 시작
   */
  private startVirtualTimeProgression(): void {
    this.isVirtualTimeRunning = true
    this.virtualTimeStartTimestamp = performance.now()
    this.virtualTimePausedAt = this.currentVirtualTime
    
    if (this.config.debugMode) {
      log('VirtualPlayerController', `Started virtual time progression from ${this.currentVirtualTime.toFixed(3)}s`)
    }
  }

  /**
   * 가상 시간 진행 일시정지
   */
  private pauseVirtualTimeProgression(): void {
    if (this.isVirtualTimeRunning) {
      this.virtualTimePausedAt = this.currentVirtualTime
      this.isVirtualTimeRunning = false
      
      if (this.config.debugMode) {
        log('VirtualPlayerController', `Paused virtual time progression at ${this.currentVirtualTime.toFixed(3)}s`)
      }
    }
  }

  /**
   * 가상 시간 진행 중지 및 초기화
   */
  private stopVirtualTimeProgression(): void {
    this.isVirtualTimeRunning = false
    this.virtualTimeStartTimestamp = 0
    this.virtualTimePausedAt = 0
    
    if (this.config.debugMode) {
      log('VirtualPlayerController', 'Stopped virtual time progression')
    }
  }

  /**
   * 연속적인 가상 시간 업데이트
   */
  private updateContinuousVirtualTime(now: DOMHighResTimeStamp): void {
    if (!this.isVirtualTimeRunning || !this.isPlaying) {
      return
    }

    // 현재 시각에서 시작 시점 차이를 계산하여 가상 시간 진행
    const elapsedMs = now - this.virtualTimeStartTimestamp
    const elapsedSeconds = elapsedMs / 1000
    
    // 재생 속도 적용하여 가상 시간 계산
    this.currentVirtualTime = this.virtualTimePausedAt + (elapsedSeconds * this.playbackRate)
    
    // 총 길이를 초과하지 않도록 제한
    const totalDuration = this.getDuration()
    this.currentVirtualTime = Math.min(this.currentVirtualTime, totalDuration)
  }

  /**
   * 가상 시간 기준으로 활성 세그먼트 찾기
   */
  private findActiveSegmentAtVirtualTime(virtualTime: number): VirtualSegment | null {
    const timeline = this.timelineMapper.timelineManager.getTimeline()
    
    return timeline.segments.find(segment => 
      segment.isEnabled &&
      virtualTime >= segment.virtualStartTime &&
      virtualTime < segment.virtualEndTime
    ) || null
  }

  /**
   * 세그먼트 변경 처리
   */
  private handleSegmentChange(newSegment: VirtualSegment | null): void {
    const previousSegment = this.currentActiveSegment
    this.currentActiveSegment = newSegment
    
    if (this.config.debugMode) {
      log('VirtualPlayerController', 
        `Segment changed: ${previousSegment?.id || 'none'} → ${newSegment?.id || 'none'} ` +
        `at virtual time ${this.currentVirtualTime.toFixed(3)}s`)
    }
    
    // 세그먼트 전환 시 필요한 추가 로직이 있다면 여기에 구현
    // 예: 세그먼트 전환 콜백 호출, 애니메이션 효과 등
  }

  /**
   * 현재 가상 시간에 따른 비디오 위치 업데이트
   */
  private updateVideoPositionFromVirtualTime(): void {
    if (!this.video) return
    
    const activeSegment = this.currentActiveSegment
    
    if (activeSegment) {
      // 활성 세그먼트가 있을 때: 해당 세그먼트의 실제 시간으로 비디오 재생
      const segmentProgress = (this.currentVirtualTime - activeSegment.virtualStartTime) / 
                            (activeSegment.virtualEndTime - activeSegment.virtualStartTime)
      
      const targetRealTime = activeSegment.realStartTime + 
                           (activeSegment.realEndTime - activeSegment.realStartTime) * segmentProgress
      
      // 비디오 위치가 크게 다를 때만 seek (작은 차이는 자연스러운 재생 유지)
      const timeDifference = Math.abs(this.video.currentTime - targetRealTime)
      if (timeDifference > 0.1) { // 100ms 이상 차이날 때만 seek
        this.video.currentTime = targetRealTime
      }
      
      // 비디오가 일시정지 상태라면 재생
      if (this.video.paused && this.isPlaying) {
        this.video.play().catch(error => {
          if (this.config.debugMode) {
            log('VirtualPlayerController', 'Video play failed during segment playback:', error)
          }
        })
      }
    } else {
      // 활성 세그먼트가 없을 때: 비디오 일시정지 (가상 시간은 계속 진행)
      if (!this.video.paused) {
        this.video.pause()
        
        if (this.config.debugMode) {
          log('VirtualPlayerController', 
            `Paused video at virtual time ${this.currentVirtualTime.toFixed(3)}s (no active segment)`)
        }
      }
    }
  }

  /**
   * 디버그 정보
   */
  getDebugInfo(): object {
    return {
      isRVFCActive: this.isRVFCActive,
      currentVirtualTime: this.currentVirtualTime,
      isPlaying: this.isPlaying,
      playbackRate: this.playbackRate,
      frameCount: this.frameCount,
      isVirtualTimeRunning: this.isVirtualTimeRunning,
      virtualTimePausedAt: this.virtualTimePausedAt,
      currentActiveSegment: this.currentActiveSegment?.id || null,
      lastVirtualTimeProcessed: this.lastVirtualTimeProcessed,
      frameProcessingDebounceMs: this.frameProcessingDebounceMs,
      callbackCounts: {
        frame: this.frameCallbacks.size,
        play: this.playCallbacks.size,
        pause: this.pauseCallbacks.size,
        seek: this.seekCallbacks.size,
        motionTextSeek: this.motionTextSeekCallbacks.size
      },
      segmentController: this.segmentController.getDebugInfo()
    }
  }
}