'use client'

import React, { useState, useEffect, useMemo } from 'react'
import VideoPlayer from './VideoPlayer'
import SubtitleOverlay from './SubtitleOverlay'
import { useEditorStore } from '../store'

interface VideoSectionProps {
  width?: number
}

const VideoSection: React.FC<VideoSectionProps> = ({ width = 300 }) => {
  const [currentTime, setCurrentTime] = useState(0)
  interface SubtitleData {
    id: string
    startTime: number
    endTime: number
    text: string
    speaker: string
    words: Array<{ word: string; start: number; end: number }>
  }

  const [subtitleData, setSubtitleData] = useState<SubtitleData[]>([])

  const {
    clips,
    showSubtitles,
    toggleSubtitles,
    subtitleSize,
    setSubtitleSize,
    subtitlePosition,
    setSubtitlePosition,
    activeSubtitleIndex,
  } = useEditorStore()

  // Load subtitle data from real.json
  useEffect(() => {
    const loadSubtitleData = async () => {
      try {
        const response = await fetch('/real.json')
        const data = await response.json()

        if (data.segments) {
          // Transform segments to subtitle format
          const subtitles = data.segments.map(
            (
              segment: {
                start_time: number
                end_time: number
                text: string
                speaker?: { speaker_id: string }
                words?: Array<{ word: string; start: number; end: number }>
              },
              index: number
            ) => ({
              id: `subtitle-${index}`,
              startTime: segment.start_time,
              endTime: segment.end_time,
              text: segment.text,
              speaker: segment.speaker?.speaker_id || '',
              words: segment.words || [],
            })
          )

          setSubtitleData(subtitles)
        }
      } catch (error) {
        console.error('Failed to load subtitle data:', error)
      }
    }

    loadSubtitleData()
  }, [])

  // Transform clips to subtitle format (if using clips instead of real.json)
  const clipsAsSubtitles = useMemo(() => {
    return clips.map((clip) => {
      // Get start time from first word and end time from last word
      const startTime = clip.words.length > 0 ? clip.words[0].start : 0
      const endTime =
        clip.words.length > 0 ? clip.words[clip.words.length - 1].end : 0

      return {
        id: clip.id,
        startTime,
        endTime,
        text: clip.fullText,
        speaker: clip.speaker,
        words: clip.words.map((w) => ({
          word: w.text,
          start: w.start,
          end: w.end,
        })),
      }
    })
  }, [clips])

  // Use real.json data if available, otherwise use clips
  const subtitles = subtitleData.length > 0 ? subtitleData : clipsAsSubtitles

  return (
    <div
      className="bg-gray-900 p-4 flex-shrink-0 h-full flex flex-col"
      style={{ width: `${width}px` }}
    >
      {/* Video Player with Subtitles */}
      <div
        className="bg-black rounded-lg mb-4 relative flex-shrink-0"
        style={{ aspectRatio: '16/9' }}
      >
        <VideoPlayer
          className="w-full h-full rounded-lg overflow-hidden"
          onTimeUpdate={setCurrentTime}
        />

        <SubtitleOverlay subtitles={subtitles} currentTime={currentTime} />
      </div>

      {/* Subtitle Controls */}
      <div className="bg-gray-800 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-300">
            Subtitle Settings
          </h3>
          <button
            onClick={toggleSubtitles}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              showSubtitles
                ? 'bg-blue-500 text-white'
                : 'bg-gray-600 text-gray-300'
            }`}
          >
            {showSubtitles ? 'ON' : 'OFF'}
          </button>
        </div>

        {showSubtitles && (
          <>
            {/* Size Control */}
            <div className="mb-2">
              <label className="text-xs text-gray-400 mb-1 block">Size</label>
              <div className="flex gap-1">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setSubtitleSize(size)}
                    className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                      subtitleSize === size
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Position Control */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Position
              </label>
              <div className="flex gap-1">
                {(['top', 'bottom'] as const).map((position) => (
                  <button
                    key={position}
                    onClick={() => setSubtitlePosition(position)}
                    className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                      subtitlePosition === position
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {position.charAt(0).toUpperCase() + position.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Subtitle Timeline (optional) */}
      <div className="flex-1 bg-gray-800 rounded-lg p-3 overflow-y-auto">
        <h3 className="text-sm font-medium text-gray-300 mb-2">
          Subtitle Timeline
        </h3>
        <div className="space-y-1">
          {subtitles.slice(0, 20).map((subtitle, index) => {
            const isActive = index === activeSubtitleIndex
            const formatTime = (seconds: number) => {
              const mins = Math.floor(seconds / 60)
              const secs = Math.floor(seconds % 60)
              return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
            }

            return (
              <div
                key={subtitle.id}
                className={`p-2 rounded text-xs cursor-pointer transition-all ${
                  isActive
                    ? 'bg-blue-500/20 border border-blue-500/50 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
                onClick={() => {
                  // Seek to subtitle time when clicked
                  const videoPlayer = (
                    window as {
                      videoPlayer?: { seekTo: (time: number) => void }
                    }
                  ).videoPlayer
                  if (videoPlayer) {
                    videoPlayer.seekTo(subtitle.startTime)
                  }
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400">
                    {formatTime(subtitle.startTime)} -{' '}
                    {formatTime(subtitle.endTime)}
                  </span>
                  {subtitle.speaker && (
                    <span className="text-blue-400 text-xs">
                      {subtitle.speaker}
                    </span>
                  )}
                </div>
                <div className={`${isActive ? 'font-medium' : ''}`}>
                  {subtitle.text}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default VideoSection
