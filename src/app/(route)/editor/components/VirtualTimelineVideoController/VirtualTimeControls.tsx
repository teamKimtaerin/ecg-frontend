'use client'

import React, { useCallback, useState } from 'react'
import Button from '@/components/ui/Button'
// import Input from '@/components/ui/Input' // Unused import
import {
  SkipBackIcon,
  SkipForwardIcon,
  // RewindIcon, // Unused import
  FastForwardIcon,
  HomeIcon,
  SettingsIcon,
} from '@/components/icons'

interface VirtualTimeControlsProps {
  currentTime: number
  duration: number
  onSeek: (virtualTime: number) => void
  onJump?: (direction: 'start' | 'end') => void
  className?: string
  showAdvancedControls?: boolean
}

export const VirtualTimeControls: React.FC<VirtualTimeControlsProps> = ({
  currentTime,
  duration,
  onSeek,
  onJump,
  className = '',
  showAdvancedControls = true,
}) => {
  const [timeInput, setTimeInput] = useState('')
  const [showTimeInput, setShowTimeInput] = useState(false)
  const [jumpDistance, setJumpDistance] = useState(5) // seconds

  // Jump intervals (in seconds)
  const jumpIntervals = [1, 5, 10, 30, 60]

  // Format time for display
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Parse time input (supports mm:ss and h:mm:ss formats)
  const parseTimeInput = useCallback((input: string): number | null => {
    const trimmed = input.trim()

    // Match formats: "123", "1:23", "1:23:45"
    const timeRegex = /^(?:(\d+):)?(\d+):(\d+)$|^(\d+)$/
    const match = timeRegex.exec(trimmed)

    if (!match) return null

    if (match[4]) {
      // Simple seconds format "123"
      return parseInt(match[4], 10)
    } else {
      // Time format "mm:ss" or "h:mm:ss"
      const hours = match[1] ? parseInt(match[1], 10) : 0
      const minutes = parseInt(match[2], 10)
      const seconds = parseInt(match[3], 10)

      return hours * 3600 + minutes * 60 + seconds
    }
  }, [])

  // Handle time input submission
  const handleTimeInputSubmit = useCallback(() => {
    const parsedTime = parseTimeInput(timeInput)

    if (parsedTime !== null && parsedTime >= 0 && parsedTime <= duration) {
      onSeek(parsedTime)
      setShowTimeInput(false)
      setTimeInput('')
    } else {
      // Invalid input - reset to current time
      setTimeInput(formatTime(currentTime))
    }
  }, [timeInput, parseTimeInput, duration, onSeek, currentTime, formatTime])

  // Handle jump backward/forward
  const handleJump = useCallback(
    (direction: 'backward' | 'forward') => {
      const delta = direction === 'forward' ? jumpDistance : -jumpDistance
      const newTime = Math.max(0, Math.min(duration, currentTime + delta))
      onSeek(newTime)
    },
    [currentTime, duration, jumpDistance, onSeek]
  )

  // Handle skip to start/end
  const handleSkip = useCallback(
    (direction: 'start' | 'end') => {
      if (direction === 'start') {
        onSeek(0)
      } else {
        onSeek(duration)
      }
      onJump?.(direction)
    },
    [onSeek, duration, onJump]
  )

  // Handle frame-by-frame navigation (assuming 30fps)
  const handleFrameStep = useCallback(
    (direction: 'backward' | 'forward') => {
      const frameTime = 1 / 30 // 30 FPS
      const delta = direction === 'forward' ? frameTime : -frameTime
      const newTime = Math.max(0, Math.min(duration, currentTime + delta))
      onSeek(newTime)
    },
    [currentTime, duration, onSeek]
  )

  return (
    <div
      className={`virtual-time-controls flex items-center gap-2 ${className}`}
    >
      {/* Skip to start */}
      <Button
        variant="secondary"
        size="small"
        onClick={() => handleSkip('start')}
        className="text-gray-300 hover:text-white"
      >
        <HomeIcon className="w-4 h-4" />
      </Button>

      {/* Large backward jump */}
      <Button
        variant="secondary"
        size="small"
        onClick={() => handleJump('backward')}
        className="text-gray-300 hover:text-white"
        // title={`Jump back ${jumpDistance}s`}
      >
        <SkipBackIcon className="w-4 h-4" />
      </Button>

      {/* Frame backward (if advanced controls enabled) */}
      {showAdvancedControls && (
        <Button
          variant="secondary"
          size="small"
          onClick={() => handleFrameStep('backward')}
          className="text-gray-300 hover:text-white text-xs"
          // title="Previous frame"
        >
          -1f
        </Button>
      )}

      {/* Time Display / Input */}
      <div className="flex items-center gap-1 min-w-32">
        {showTimeInput ? (
          <input
            type="text"
            value={timeInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTimeInput(e.target.value)
            }
            onBlur={handleTimeInputSubmit}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                handleTimeInputSubmit()
              } else if (e.key === 'Escape') {
                setShowTimeInput(false)
                setTimeInput('')
              }
            }}
            className="w-20 text-center text-sm bg-gray-700 text-white border border-gray-600 rounded px-1 py-0.5"
            placeholder="mm:ss"
            autoFocus
          />
        ) : (
          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              setShowTimeInput(true)
              setTimeInput(formatTime(currentTime))
            }}
            className="text-white font-mono text-sm hover:bg-gray-700"
            // title="Click to edit time"
          >
            {formatTime(currentTime)}
          </Button>
        )}

        <span className="text-gray-500 text-sm">/</span>
        <span className="text-gray-300 font-mono text-sm">
          {formatTime(duration)}
        </span>
      </div>

      {/* Frame forward (if advanced controls enabled) */}
      {showAdvancedControls && (
        <Button
          variant="secondary"
          size="small"
          onClick={() => handleFrameStep('forward')}
          className="text-gray-300 hover:text-white text-xs"
          // title="Next frame"
        >
          +1f
        </Button>
      )}

      {/* Large forward jump */}
      <Button
        variant="secondary"
        size="small"
        onClick={() => handleJump('forward')}
        className="text-gray-300 hover:text-white"
        // title={`Jump forward ${jumpDistance}s`}
      >
        <SkipForwardIcon className="w-4 h-4" />
      </Button>

      {/* Skip to end */}
      <Button
        variant="secondary"
        size="small"
        onClick={() => handleSkip('end')}
        className="text-gray-300 hover:text-white"
        // title="Jump to end"
      >
        <FastForwardIcon className="w-4 h-4" />
      </Button>

      {/* Jump distance selector (if advanced controls enabled) */}
      {showAdvancedControls && (
        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-gray-400">Jump:</span>
          <select
            value={jumpDistance}
            onChange={(e) => setJumpDistance(parseInt(e.target.value, 10))}
            className="bg-gray-700 text-white border border-gray-600 rounded px-1 py-0.5 text-xs"
          >
            {jumpIntervals.map((interval) => (
              <option key={interval} value={interval}>
                {interval}s
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Settings button for additional options */}
      {showAdvancedControls && (
        <Button
          variant="secondary"
          size="small"
          className="text-gray-400 hover:text-white ml-2"
          // title="Timeline settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}

export default VirtualTimeControls
