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
      className="bg-white p-4 flex-shrink-0 h-full flex flex-col border-r border-gray-200"
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
    </div>
  )
}

export default VideoSection
