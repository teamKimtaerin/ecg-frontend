'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { mediaStorage } from '@/utils/storage/mediaStorage'
import { log } from '@/utils/logger'

import { VIDEO_PLAYER_CONSTANTS } from '@/lib/utils/constants'

interface VideoPlayerProps {
  className?: string
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [isDraggingVolume, setIsDraggingVolume] = useState(false)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)

  // Get media state from store
  const { mediaId, videoUrl, videoName, setVideoLoading, setVideoError } =
    useEditorStore()

  // Load video from IndexedDB or URL
  useEffect(() => {
    const loadVideo = async () => {
      // First check if we have a video URL from store
      if (videoUrl) {
        log('VideoPlayer.tsx', `Using video URL from store: ${videoUrl}`)
        setVideoSrc(videoUrl)
        return
      }

      // Check if we have a media ID from store
      if (mediaId) {
        log(
          'VideoPlayer.tsx',
          `Loading video from IndexedDB with mediaId: ${mediaId}`
        )
        setVideoLoading(true)

        try {
          const blobUrl = await mediaStorage.createBlobUrl(mediaId)
          if (blobUrl) {
            log(
              'VideoPlayer.tsx',
              `Video loaded from IndexedDB: ${videoName || 'unknown'}`
            )
            setVideoSrc(blobUrl)
          } else {
            setVideoError('Failed to load video from storage')
          }
        } catch (error) {
          console.error('Failed to load video:', error)
          setVideoError('Failed to load video')
        } finally {
          setVideoLoading(false)
        }
        return
      }

      // Fallback to demo video if no media
      log('VideoPlayer.tsx', 'No media found, using demo video')
      setVideoSrc(
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
      )
    }

    loadVideo()
  }, [mediaId, videoUrl, videoName, setVideoLoading, setVideoError])

  // 비디오 상태 체크를 위한 useEffect
  useEffect(() => {
    const video = videoRef.current
    if (video && videoSrc) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Video element found:', video)
        console.log('Video readyState:', video.readyState)
        console.log('Video src:', video.currentSrc || video.src)
      }

      // 비디오가 이미 로드된 경우 즉시 duration 설정
      if (video.readyState >= 1 && video.duration) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Video already loaded, setting duration:', video.duration)
        }
        setDuration(video.duration)
      }

      // 비디오 이벤트 리스너들
      const handleLoadStart = () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Video load start')
        }
      }
      const handleCanPlay = () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Video can play')
        }
      }
      const handleError = (e: Event) => {
        console.error('Video error:', e)
        setVideoError('Video playback error')
      }

      video.addEventListener('loadstart', handleLoadStart)
      video.addEventListener('canplay', handleCanPlay)
      video.addEventListener('error', handleError)

      return () => {
        video.removeEventListener('loadstart', handleLoadStart)
        video.removeEventListener('canplay', handleCanPlay)
        video.removeEventListener('error', handleError)
      }
    }
  }, [videoSrc, setVideoError])

  // 재생/일시정지 토글
  const togglePlay = async () => {
    if (videoRef.current) {
      try {
        if (isPlaying) {
          videoRef.current.pause()
          setIsPlaying(false)
        } else {
          await videoRef.current.play()
          setIsPlaying(true)
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log('재생 중 오류 발생:', error)
        }
        setIsPlaying(false)
      }
    }
  }

  // 10초 뒤로
  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        videoRef.current.currentTime - VIDEO_PLAYER_CONSTANTS.SKIP_TIME_SECONDS
      )
    }
  }

  // 10초 앞으로
  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        duration,
        videoRef.current.currentTime + VIDEO_PLAYER_CONSTANTS.SKIP_TIME_SECONDS
      )
    }
  }

  // 재생 속도 변경
  const changePlaybackRate = () => {
    const rates = VIDEO_PLAYER_CONSTANTS.PLAYBACK_RATES
    const currentIndex = rates.indexOf(playbackRate as (typeof rates)[number])
    const nextRate = rates[(currentIndex + 1) % rates.length]
    setPlaybackRate(nextRate)
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate
    }
  }

  // 볼륨 변경 (부드러운 조절을 위한 최적화)
  const changeVolume = useCallback(
    (newVolume: number) => {
      // NaN, Infinity, -Infinity 체크
      if (!Number.isFinite(newVolume)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Invalid volume value:', newVolume)
        }
        return
      }

      const clampedVolume = Math.max(0, Math.min(1, newVolume))

      // 추가 안전성 체크
      if (!Number.isFinite(clampedVolume)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Clamped volume is not finite:', clampedVolume)
        }
        return
      }

      setVolume(clampedVolume)
      if (videoRef.current) {
        videoRef.current.volume = clampedVolume
      }
      if (clampedVolume === 0 && !isMuted) {
        setIsMuted(true)
      } else if (clampedVolume > 0 && isMuted) {
        setIsMuted(false)
      }
    },
    [isMuted]
  )

  // 음소거 토글
  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        // 음소거 해제 시 이전 볼륨으로 복원
        const restoreVolume = Number.isFinite(volume) && volume > 0 ? volume : 1
        videoRef.current.volume = restoreVolume
        videoRef.current.muted = false
        setIsMuted(false)
        // 상태도 동기화
        if (volume !== restoreVolume) {
          setVolume(restoreVolume)
        }
      } else {
        // 음소거 시
        videoRef.current.volume = 0
        videoRef.current.muted = true
        setIsMuted(true)
      }
    }
  }

  // 진행바 클릭 시 시간 이동
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect()
      const clickPosition = (e.clientX - rect.left) / rect.width
      const newTime = clickPosition * duration
      if (process.env.NODE_ENV === 'development') {
        console.log(
          'Progress click:',
          clickPosition,
          'New time:',
          newTime,
          'Duration:',
          duration
        )
      }
      videoRef.current.currentTime = newTime
    }
  }

  // 시간 업데이트
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime
      const newDuration = videoRef.current.duration
      if (process.env.NODE_ENV === 'development') {
        console.log('Time update:', newTime, 'Duration:', newDuration)
      }
      setCurrentTime(newTime)
      if (newDuration && !isNaN(newDuration)) {
        setDuration(newDuration)
      }
    }
  }

  // 메타데이터 로드
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration
      if (process.env.NODE_ENV === 'development') {
        console.log('Metadata loaded, duration:', videoDuration)
      }
      if (videoDuration && !isNaN(videoDuration)) {
        setDuration(videoDuration)
      }
    }
  }

  // 시간 포맷팅 함수
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / VIDEO_PLAYER_CONSTANTS.SECONDS_PER_MINUTE)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div
      className={`flex-1 bg-slate-800/80 backdrop-blur-sm border border-slate-600/40 rounded-lg mx-2 my-4 shadow-xl ${className}`}
    >
      <div className="p-4 h-full flex flex-col">
        {/* Video Screen */}
        <div className="relative aspect-video rounded-lg mb-4 flex-shrink-0 bg-black">
          <video
            ref={videoRef}
            className="w-full h-full rounded-lg"
            src={videoSrc || undefined}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            crossOrigin="anonymous"
          >
            비디오를 지원하지 않는 브라우저입니다.
          </video>

          {/* Subtitle Overlay */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded text-sm">
            {/* 자막이 여기에 표시됩니다 */}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative mb-4">
          <div
            className="w-full h-2 bg-slate-700 rounded-full shadow-inner cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-gradient-to-r from-slate-400 to-gray-400 rounded-full shadow-sm transition-all duration-150"
              style={{
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center justify-center space-x-3 mb-3">
          <div className="bg-gradient-to-r from-slate-600 to-gray-600 rounded-lg p-2 flex items-center space-x-3 shadow-md">
            <button
              onClick={skipBackward}
              className="text-white hover:text-slate-300 transition-colors"
              title={`${VIDEO_PLAYER_CONSTANTS.SKIP_TIME_SECONDS}초 뒤로`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button
              onClick={togglePlay}
              className="text-white hover:text-slate-300 transition-colors"
              title={isPlaying ? '일시정지' : '재생'}
            >
              {isPlaying ? (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={skipForward}
              className="text-white hover:text-slate-300 transition-colors"
              title={`${VIDEO_PLAYER_CONSTANTS.SKIP_TIME_SECONDS}초 앞으로`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
              </svg>
            </button>

            <button
              onClick={changePlaybackRate}
              className="text-white hover:text-slate-300 transition-colors text-sm font-bold px-2"
              title="재생 속도 변경"
            >
              {playbackRate}x
            </button>

            <div className="relative flex items-center">
              <button
                onClick={toggleMute}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className="text-white hover:text-slate-300 transition-colors"
                title={isMuted ? '음소거 해제' : '음소거'}
              >
                {isMuted || volume === 0 ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : volume > 0.5 ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M7 9v6h4l5 5V4l-5 5H7z" />
                  </svg>
                )}
              </button>

              {/* Volume Slider */}
              {showVolumeSlider && (
                <div
                  className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-lg p-3 shadow-xl z-50"
                  onMouseLeave={() => setShowVolumeSlider(false)}
                  onMouseEnter={() => setShowVolumeSlider(true)}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="text-xs text-slate-300 font-medium">
                      {Math.round((isMuted ? 0 : volume) * 100)}%
                    </div>
                    <div
                      className="h-20 w-6 flex items-center justify-center cursor-pointer"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setIsDraggingVolume(true)

                        const sliderTrack =
                          e.currentTarget.querySelector('.w-1\\.5')
                        if (
                          !sliderTrack ||
                          !(sliderTrack instanceof HTMLElement)
                        )
                          return

                        const updateVolume = (clientY: number) => {
                          const rect = sliderTrack.getBoundingClientRect()

                          // 안전성 체크
                          if (!rect || rect.height === 0) return

                          const y = Math.max(
                            0,
                            Math.min(rect.height, rect.bottom - clientY)
                          )
                          const newVolume = y / rect.height

                          // 추가 검증
                          if (Number.isFinite(newVolume)) {
                            changeVolume(newVolume)
                          }
                        }

                        // 초기 클릭 위치에서 볼륨 설정
                        updateVolume(e.clientY)

                        const handleMouseMove = (e: MouseEvent) => {
                          e.preventDefault()
                          updateVolume(e.clientY)
                        }

                        const handleMouseUp = () => {
                          setIsDraggingVolume(false)
                          document.removeEventListener(
                            'mousemove',
                            handleMouseMove
                          )
                          document.removeEventListener('mouseup', handleMouseUp)
                        }

                        document.addEventListener('mousemove', handleMouseMove)
                        document.addEventListener('mouseup', handleMouseUp)
                      }}
                    >
                      {/* Volume Track */}
                      <div className="h-20 w-1.5 bg-slate-600 rounded-full relative">
                        {/* Volume Fill */}
                        <div
                          className={`absolute bottom-0 left-0 w-full bg-gradient-to-t from-slate-300 to-gray-400 rounded-full ${
                            isDraggingVolume
                              ? ''
                              : 'transition-all duration-100'
                          }`}
                          style={{ height: `${(isMuted ? 0 : volume) * 100}%` }}
                        />
                        {/* Volume Handle */}
                        <div
                          className={`absolute w-3 h-3 bg-white border border-slate-400 rounded-full shadow-sm cursor-grab transform -translate-x-1/2 -translate-y-1/2 ${
                            isDraggingVolume
                              ? 'scale-125 shadow-lg border-slate-300'
                              : 'hover:scale-110 transition-transform'
                          } active:cursor-grabbing`}
                          style={{
                            bottom: `${(isMuted ? 0 : volume) * 100}%`,
                            left: '50%',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer
