'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useEditorStore } from '../store'

interface Subtitle {
  id: string
  startTime: number
  endTime: number
  text: string
  speaker?: string
}

interface SubtitleOverlayProps {
  subtitles?: Subtitle[]
  currentTime: number
  className?: string
}

export default function SubtitleOverlay({
  subtitles = [],
  currentTime,
  className = '',
}: SubtitleOverlayProps) {
  const {
    showSubtitles,
    subtitleSize,
    subtitlePosition,
    activeSubtitleIndex,
    setActiveSubtitleIndex,
  } = useEditorStore()

  const [displayText, setDisplayText] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Find active subtitle based on current time
  const activeSubtitle = useMemo(() => {
    return subtitles.find(
      (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
    )
  }, [currentTime, subtitles])

  // Update active subtitle index in store
  useEffect(() => {
    const newIndex = activeSubtitle
      ? subtitles.findIndex((sub) => sub.id === activeSubtitle.id)
      : null

    if (newIndex !== activeSubtitleIndex) {
      setActiveSubtitleIndex(newIndex)

      // Trigger transition animation
      if (newIndex !== null) {
        setIsTransitioning(true)
        setTimeout(() => setIsTransitioning(false), 200)
      }
    }
  }, [activeSubtitle, subtitles, activeSubtitleIndex, setActiveSubtitleIndex])

  // Update display text with fade effect
  useEffect(() => {
    if (activeSubtitle) {
      setDisplayText(activeSubtitle.text)
    } else {
      setDisplayText('')
    }
  }, [activeSubtitle])

  // Don't render if subtitles are hidden
  if (!showSubtitles || !displayText) {
    return null
  }

  // Determine text size classes
  const sizeClasses = {
    small: 'text-sm px-3 py-1',
    medium: 'text-base px-4 py-2',
    large: 'text-lg px-5 py-3',
  }[subtitleSize]

  // Determine position classes
  const positionClasses = {
    top: 'top-8',
    bottom: 'bottom-8',
  }[subtitlePosition]

  return (
    <div
      className={`absolute left-0 right-0 ${positionClasses} flex justify-center items-center pointer-events-none z-10 ${className}`}
    >
      <div
        className={`
          max-w-[80%] mx-auto
          bg-black/80 backdrop-blur-sm
          text-white font-medium
          rounded-md
          transition-all duration-200
          ${sizeClasses}
          ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        `}
      >
        {/* Speaker label if available */}
        {activeSubtitle?.speaker && (
          <span className="text-blue-400 mr-2">{activeSubtitle.speaker}:</span>
        )}

        {/* Subtitle text */}
        <span className="leading-relaxed">{displayText}</span>
      </div>
    </div>
  )
}

// Utility component for word-level highlighting (optional advanced feature)
export function SubtitleWithWordHighlight({
  words,
  currentTime,
  className = '',
}: {
  words: Array<{ word: string; start: number; end: number }>
  currentTime: number
  className?: string
}) {
  const { showSubtitles, subtitleSize } = useEditorStore()

  if (!showSubtitles || !words.length) {
    return null
  }

  const sizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  }[subtitleSize]

  return (
    <div className={`${sizeClasses} ${className}`}>
      {words.map((wordData, index) => {
        const isActive =
          currentTime >= wordData.start && currentTime <= wordData.end

        return (
          <span
            key={index}
            className={`
              transition-all duration-150
              ${
                isActive
                  ? 'text-yellow-300 font-bold scale-110 inline-block'
                  : 'text-white'
              }
            `}
          >
            {wordData.word}{' '}
          </span>
        )
      })}
    </div>
  )
}
