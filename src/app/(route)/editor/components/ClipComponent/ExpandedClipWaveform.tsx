import React, { useRef, useEffect, useState, useCallback } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { useEditorStore } from '../../store'
import { IoPlay, IoPause, IoArrowUndo, IoArrowRedo } from 'react-icons/io5'
import { Word } from './types'

interface ExpandedClipWaveformProps {
  clipId: string
  words: Word[]
  focusedWordId: string | null
}

// Gaussian smoothing filter for smooth waveform
function gaussianSmooth(data: number[], radius: number = 3): number[] {
  if (data.length === 0) return data

  const smoothed = [...data]
  const weights: number[] = []

  // Generate Gaussian weights
  for (let i = -radius; i <= radius; i++) {
    weights.push(Math.exp(-(i * i) / (2 * radius * radius)))
  }

  // Normalize weights
  const sum = weights.reduce((a, b) => a + b, 0)
  weights.forEach((w, i) => (weights[i] = w / sum))

  // Apply smoothing
  for (let i = radius; i < data.length - radius; i++) {
    let value = 0
    for (let j = -radius; j <= radius; j++) {
      value += data[i + j] * weights[j + radius]
    }
    smoothed[i] = value
  }

  return smoothed
}

// Cubic interpolation for smooth transitions
function cubicInterpolate(t: number): number {
  return t * t * (3 - 2 * t)
}

// Load and process audio data from real.json
async function loadClipAudioData(words: Word[]) {
  try {
    const response = await fetch('/real.json')
    const data = await response.json()

    // Extract volume data for all words in this clip
    const volumeData: number[] = []
    const sampleRate = 100 // Simulated sample rate (samples per second)

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const duration = word.end - word.start
      const samplesForWord = Math.max(10, Math.ceil(duration * sampleRate))

      // Find current word volume data from segments
      let currentVolume = -20 // Default volume
      let currentPitch = 440 // Default pitch for variation

      for (const segment of data.segments) {
        const wordData = segment.words?.find(
          (w: { word: string; start: number }) =>
            w.word === word.text && Math.abs(w.start - word.start) < 0.1
        )
        if (wordData && wordData.volume_db !== undefined) {
          currentVolume = wordData.volume_db
          currentPitch = wordData.pitch_hz || 440
          break
        }
      }

      // Find next word volume for smooth transitions
      let nextVolume = currentVolume
      if (i < words.length - 1) {
        const nextWord = words[i + 1]
        for (const segment of data.segments) {
          const nextWordData = segment.words?.find(
            (w: { word: string; start: number }) =>
              w.word === nextWord.text &&
              Math.abs(w.start - nextWord.start) < 0.1
          )
          if (nextWordData && nextWordData.volume_db !== undefined) {
            nextVolume = nextWordData.volume_db
            break
          }
        }
      }

      // Generate samples with smooth interpolation and natural variation
      for (let j = 0; j < samplesForWord; j++) {
        const progress = j / samplesForWord

        // Use cubic interpolation for smooth transition to next word
        const smoothProgress = cubicInterpolate(progress)
        const interpolatedVolume =
          currentVolume + (nextVolume - currentVolume) * smoothProgress

        // Add natural variation based on frequency and time
        const timeOffset = (word.start + duration * progress) * 2 * Math.PI
        const naturalVariation =
          Math.sin((timeOffset * currentPitch) / 1000) * 0.3 + // Primary frequency component
          Math.sin((timeOffset * currentPitch) / 500) * 0.2 + // Harmonic
          Math.sin(timeOffset * 0.5) * 0.1 // Low frequency modulation

        volumeData.push(interpolatedVolume + naturalVariation)
      }
    }

    // Apply Gaussian smoothing for even smoother transitions
    const smoothedData = gaussianSmooth(volumeData, 4)

    // Normalize volume data to 0-1 range for waveform peaks
    const minDb = -45
    const maxDb = 0
    const peaks = smoothedData.map((db) => {
      const normalized = (db - minDb) / (maxDb - minDb)
      return Math.max(0, Math.min(1, normalized))
    })

    return peaks
  } catch (error) {
    console.error('Failed to load audio data:', error)
    // Generate fallback waveform data with smooth transitions
    const totalSamples = words.length * 50
    const fallbackData = Array.from({ length: totalSamples }, (_, i) => {
      const t = i / totalSamples
      return (
        0.3 + 0.4 * Math.sin(t * Math.PI * 8) + 0.2 * Math.sin(t * Math.PI * 20)
      )
    })
    return gaussianSmooth(fallbackData)
  }
}

export default function ExpandedClipWaveform({
  clipId,
  words,
  focusedWordId,
}: ExpandedClipWaveformProps) {
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [peaks, setPeaks] = useState<number[]>([])

  const {
    expandedWordId,
    wordTimingAdjustments,
    wordAnimationIntensity,
    wordAnimationTracks,
    updateWordTiming,
    updateAnimationIntensity,
    updateAnimationTrackTiming,
    updateAnimationTrackIntensity,
    undoWordTiming,
    redoWordTiming,
    setHasUnsavedChanges,
    playSegment,
    stopSegmentPlayback,
    isPlaying: isVideoPlaying,
  } = useEditorStore()

  // Find the focused word
  const focusedWord = words.find(
    (w) => w.id === (focusedWordId || expandedWordId)
  )

  // Get current adjustments or default values (unused for now but kept for future use)
  // const timingAdjustment = focusedWord && wordTimingAdjustments.get(focusedWord.id) || {
  //   start: focusedWord?.start || 0,
  //   end: focusedWord?.end || 0,
  // }

  // const animationIntensity = focusedWord && wordAnimationIntensity.get(focusedWord.id) || {
  //   min: 0.3,
  //   max: 0.7,
  // }

  // Local state for dragging - track for each word
  const [draggedWordId, setDraggedWordId] = useState<string | null>(null)
  const [dragType, setDragType] = useState<string | null>(null)
  const [dragStartPosition, setDragStartPosition] = useState<number>(0)

  // Calculate clip duration
  const clipDuration =
    words.length > 0 ? words[words.length - 1].end - words[0].start : 0

  // Load audio data
  useEffect(() => {
    loadClipAudioData(words).then((data) => {
      setPeaks(data)
    })
  }, [words])

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current || peaks.length === 0) return

    // Create WaveSurfer instance
    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#9CA3AF',
      progressColor: '#3B82F6',
      cursorColor: '#EF4444',
      barWidth: 2,
      barRadius: 3,
      height: 120,
      normalize: true,
      backend: 'WebAudio',
      interact: false,
    })

    // Load peaks data - WaveSurfer expects array of arrays for stereo
    ws.load('', [peaks], clipDuration)

    wavesurferRef.current = ws

    // Cleanup
    return () => {
      ws.destroy()
    }
  }, [peaks, clipDuration])

  // Handle play/pause with video player sync
  const togglePlayback = useCallback(() => {
    if (!focusedWord) return

    const timing = wordTimingAdjustments.get(focusedWord.id) || {
      start: focusedWord.start,
      end: focusedWord.end,
    }

    if (isVideoPlaying) {
      stopSegmentPlayback()
      setIsPlaying(false)
    } else {
      playSegment(timing.start, timing.end)
      setIsPlaying(true)
    }
  }, [
    focusedWord,
    isVideoPlaying,
    wordTimingAdjustments,
    playSegment,
    stopSegmentPlayback,
  ])

  // Calculate bar positions (0-1 scale) relative to entire clip
  const getBarPosition = useCallback(
    (time: number) => {
      if (words.length === 0) return 0
      const clipStart = words[0].start
      const position = (time - clipStart) / clipDuration
      return Math.max(0, Math.min(1, position))
    },
    [words, clipDuration]
  )

  // Handle drag start for word bars
  const handleDragStart = useCallback(
    (wordId: string, barType: string, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDraggedWordId(wordId)
      setDragType(barType)
      setIsDragging(true)
      
      // Store initial drag position for move operations
      if (waveformRef.current) {
        const rect = waveformRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const position = Math.max(0, Math.min(1, x / rect.width))
        setDragStartPosition(position)
      }
    },
    []
  )

  // Handle drag move
  useEffect(() => {
    if (!isDragging || !draggedWordId || !dragType || !waveformRef.current)
      return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = waveformRef.current!.getBoundingClientRect()
      const x = e.clientX - rect.left
      const position = Math.max(0, Math.min(1, x / rect.width))
      const clipStart = words[0].start
      const time = clipStart + position * clipDuration

      const word = words.find((w) => w.id === draggedWordId)
      if (!word) return

      const currentTiming = wordTimingAdjustments.get(draggedWordId) || {
        start: word.start,
        end: word.end,
      }

      const currentIntensity = wordAnimationIntensity.get(draggedWordId) || {
        min: 0.3,
        max: 0.7,
      }

      if (dragType === 'timing-start') {
        const newStart = Math.min(time, currentTiming.end - 0.01)
        updateWordTiming(draggedWordId, newStart, currentTiming.end)
        setHasUnsavedChanges(true)
      } else if (dragType === 'timing-end') {
        const newEnd = Math.max(time, currentTiming.start + 0.01)
        updateWordTiming(draggedWordId, currentTiming.start, newEnd)
        setHasUnsavedChanges(true)
      } else if (dragType === 'animation-min') {
        const newMin = Math.min(position, currentIntensity.max - 0.05)
        updateAnimationIntensity(draggedWordId, newMin, currentIntensity.max)
        setHasUnsavedChanges(true)
      } else if (dragType === 'animation-max') {
        const newMax = Math.max(position, currentIntensity.min + 0.05)
        updateAnimationIntensity(draggedWordId, currentIntensity.min, newMax)
        setHasUnsavedChanges(true)
      } else if (dragType.startsWith('track-')) {
        // Handle animation track bars
        const [, assetId, barType] = dragType.split('-')
        const tracks = wordAnimationTracks.get(draggedWordId) || []
        const track = tracks.find((t) => t.assetId === assetId)

        if (track) {
          if (barType === 'start') {
            const newStart = Math.min(time, track.timing.end - 0.01)
            updateAnimationTrackTiming(
              draggedWordId,
              assetId,
              newStart,
              track.timing.end
            )
            setHasUnsavedChanges(true)
          } else if (barType === 'end') {
            const newEnd = Math.max(time, track.timing.start + 0.01)
            updateAnimationTrackTiming(
              draggedWordId,
              assetId,
              track.timing.start,
              newEnd
            )
            setHasUnsavedChanges(true)
          } else if (barType === 'move') {
            // Move the entire track to follow mouse position
            const duration = track.timing.end - track.timing.start
            const clipStart = words[0].start
            const newStart = clipStart + position * clipDuration - duration / 2
            
            // Constrain within clip bounds
            const clipEnd = words[words.length - 1].end
            const constrainedStart = Math.max(clipStart, Math.min(newStart, clipEnd - duration))
            const constrainedEnd = constrainedStart + duration
            
            updateAnimationTrackTiming(
              draggedWordId,
              assetId,
              constrainedStart,
              constrainedEnd
            )
            setHasUnsavedChanges(true)
          }
        }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setDraggedWordId(null)
      setDragType(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [
    isDragging,
    draggedWordId,
    dragType,
    words,
    clipDuration,
    wordTimingAdjustments,
    wordAnimationIntensity,
    wordAnimationTracks,
    updateWordTiming,
    updateAnimationIntensity,
    updateAnimationTrackTiming,
    updateAnimationTrackIntensity,
    setHasUnsavedChanges,
  ])

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    if (focusedWord) {
      undoWordTiming(focusedWord.id)
      setHasUnsavedChanges(true)
    }
  }, [focusedWord, undoWordTiming, setHasUnsavedChanges])

  const handleRedo = useCallback(() => {
    if (focusedWord) {
      redoWordTiming(focusedWord.id)
      setHasUnsavedChanges(true)
    }
  }, [focusedWord, redoWordTiming, setHasUnsavedChanges])

  // Sync playback state with video player
  useEffect(() => {
    setIsPlaying(isVideoPlaying)
  }, [isVideoPlaying])

  return (
    <div className="w-full bg-white border-t border-gray-300 animate-in slide-in-from-top duration-200">
      {/* Waveform Container */}
      <div className="relative bg-gray-50 mx-4 my-3 rounded-lg p-4 pt-8 border border-gray-200">
        {/* Red center line */}
        <div
          className="absolute left-0 right-0 top-1/2 h-px bg-red-500 opacity-60 pointer-events-none z-10"
          style={{ transform: 'translateY(-50%)' }}
        />

        {/* Waveform */}
        <div ref={waveformRef} className="relative" />

        {/* Dark overlay outside selected word timing */}
        {focusedWord &&
          (() => {
            const timing = wordTimingAdjustments.get(focusedWord.id) || {
              start: focusedWord.start,
              end: focusedWord.end,
            }
            return (
              <>
                {/* Left overlay (before start) */}
                <div
                  className="absolute top-0 bottom-0 left-0 bg-black/70 pointer-events-none z-20"
                  style={{
                    width: `${getBarPosition(timing.start) * 100}%`,
                  }}
                />
                {/* Right overlay (after end) */}
                <div
                  className="absolute top-0 bottom-0 right-0 bg-black/70 pointer-events-none z-20"
                  style={{
                    width: `${(1 - getBarPosition(timing.end)) * 100}%`,
                  }}
                />
              </>
            )
          })()}

        {/* Word boundaries - vertical lines for each word */}
        {words.map((word) => {
          const startPos = getBarPosition(word.start)
          const isSelected = word.id === focusedWord?.id

          return (
            <div
              key={word.id}
              className={`absolute top-0 bottom-0 pointer-events-none ${
                isSelected ? 'bg-blue-500/10' : ''
              }`}
              style={{
                left: `${startPos * 100}%`,
                width: `${(getBarPosition(word.end) - startPos) * 100}%`,
              }}
            >
              {/* Word boundary line */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-px ${
                  isSelected ? 'bg-blue-400' : 'bg-gray-600'
                } opacity-50`}
              />
              {/* Word label */}
              <div
                className={`absolute -top-7 left-0 text-xs whitespace-nowrap ${
                  isSelected ? 'text-blue-600 font-semibold' : 'text-gray-600'
                }`}
              >
                {word.text}
              </div>
            </div>
          )
        })}

        {/* Draggable bars ONLY for focused word */}
        {focusedWord &&
          (() => {
            const timing = wordTimingAdjustments.get(focusedWord.id) || {
              start: focusedWord.start,
              end: focusedWord.end,
            }
            // Intensity is not used in current implementation
            // const intensity = wordAnimationIntensity.get(focusedWord.id) || {
            //   min: 0.3,
            //   max: 0.7,
            // }

            const timingStartPos = getBarPosition(timing.start)
            const timingEndPos = getBarPosition(timing.end)

            return (
              <React.Fragment key={focusedWord.id}>
                {/* Timing Bars (Blue for focused word) - Top */}
                <div
                  className="absolute top-0 w-2 cursor-ew-resize transition-colors z-30 bg-blue-500 hover:bg-blue-400 border border-blue-600 rounded-sm"
                  style={{
                    left: `${timingStartPos * 100}%`,
                    transform: 'translateX(-50%)',
                    height: '40%',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                  onMouseDown={(e) =>
                    handleDragStart(focusedWord.id, 'timing-start', e)
                  }
                  title={`${focusedWord.text} 시작: ${timing.start.toFixed(2)}s`}
                ></div>

                <div
                  className="absolute top-0 w-2 cursor-ew-resize transition-colors z-30 bg-blue-500 hover:bg-blue-400 border border-blue-600 rounded-sm"
                  style={{
                    left: `${timingEndPos * 100}%`,
                    transform: 'translateX(-50%)',
                    height: '40%',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                  onMouseDown={(e) =>
                    handleDragStart(focusedWord.id, 'timing-end', e)
                  }
                  title={`${focusedWord.text} 종료: ${timing.end.toFixed(2)}s`}
                ></div>

                {/* Animation Track Rectangles - Multiple tracks per word (max 3) */}
                {(() => {
                  const tracks = wordAnimationTracks.get(focusedWord.id) || []
                  const trackColors = {
                    blue: {
                      base: 'bg-blue-500',
                      hover: 'bg-blue-400',
                      label: 'bg-blue-600',
                      text: 'text-white',
                    },
                    green: {
                      base: 'bg-green-500',
                      hover: 'bg-green-400',
                      label: 'bg-green-600',
                      text: 'text-white',
                    },
                    purple: {
                      base: 'bg-purple-500',
                      hover: 'bg-purple-400',
                      label: 'bg-purple-600',
                      text: 'text-white',
                    },
                  }

                  return tracks.map((track, trackIndex) => {
                    const colors = trackColors[track.color]
                    const topOffset = 50 + trackIndex * 15 // Position below red line with more space
                    const startPos = getBarPosition(track.timing.start)
                    const endPos = getBarPosition(track.timing.end)
                    const width = (endPos - startPos) * 100

                    return (
                      <React.Fragment
                        key={`${focusedWord.id}-${track.assetId}`}
                      >
                        {/* Track timing rectangle with draggable borders and moveable center */}
                        <div
                          className={`absolute transition-colors z-30 ${colors.base} hover:${colors.hover} border border-gray-300 rounded-md shadow-lg overflow-hidden group`}
                          style={{
                            left: `${startPos * 100}%`,
                            width: `${width}%`,
                            top: `${topOffset}%`,
                            height: '25px',
                          }}
                        >
                          {/* Left border handle (start) */}
                          <div
                            className="absolute left-0 top-0 w-1 h-full cursor-ew-resize bg-black/50 hover:bg-white transition-all z-50"
                            onMouseDown={(e) =>
                              handleDragStart(
                                focusedWord.id,
                                `track-${track.assetId}-start`,
                                e
                              )
                            }
                            title={`${track.assetName} 시작: ${track.timing.start.toFixed(2)}s`}
                          />

                          {/* Right border handle (end) */}
                          <div
                            className="absolute right-0 top-0 w-1 h-full cursor-ew-resize bg-black/50 hover:bg-white transition-all z-50"
                            onMouseDown={(e) =>
                              handleDragStart(
                                focusedWord.id,
                                `track-${track.assetId}-end`,
                                e
                              )
                            }
                            title={`${track.assetName} 종료: ${track.timing.end.toFixed(2)}s`}
                          />

                          {/* Center area for moving entire track */}
                          <div
                            className="absolute left-1 right-1 top-0 h-full cursor-move hover:bg-black/10 transition-all z-40"
                            onMouseDown={(e) =>
                              handleDragStart(
                                focusedWord.id,
                                `track-${track.assetId}-move`,
                                e
                              )
                            }
                            title={`${track.assetName} 이동: ${track.timing.start.toFixed(2)}s - ${track.timing.end.toFixed(2)}s`}
                          />

                          {/* Animation name inside rectangle */}
                          <div
                            className={`absolute inset-1 flex items-center justify-center ${colors.text} text-xs font-medium pointer-events-none z-45 truncate`}
                          >
                            {track.assetName}
                          </div>
                        </div>

                      </React.Fragment>
                    )
                  })
                })()}
              </React.Fragment>
            )
          })()}
      </div>

      {/* Controls and Info */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Playback Control */}
          <button
            onClick={togglePlayback}
            className="p-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded transition-colors"
            title={isPlaying ? '일시정지' : '재생'}
            disabled={!focusedWord}
          >
            {isPlaying ? (
              <IoPause size={18} className="text-gray-700" />
            ) : (
              <IoPlay size={18} className="text-gray-700" />
            )}
          </button>

          {/* Undo Button */}
          <button
            onClick={handleUndo}
            className="p-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded transition-colors"
            title="되돌리기"
            disabled={!focusedWord}
          >
            <IoArrowUndo size={18} className="text-gray-700" />
          </button>

          {/* Redo Button */}
          <button
            onClick={handleRedo}
            className="p-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded transition-colors"
            title="다시 실행"
            disabled={!focusedWord}
          >
            <IoArrowRedo size={18} className="text-gray-700" />
          </button>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-sm border border-blue-600"></div>
              <span>타이밍</span>
            </div>
            {focusedWord &&
              (() => {
                const tracks = wordAnimationTracks.get(focusedWord.id) || []
                if (tracks.length === 0) {
                  return (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">애니메이션 없음</span>
                    </div>
                  )
                }
                return tracks.map((track) => (
                  <div key={track.assetId} className="flex items-center gap-1">
                    <div
                      className={`w-3 h-3 rounded-sm ${
                        track.color === 'blue'
                          ? 'bg-blue-500'
                          : track.color === 'green'
                            ? 'bg-green-500'
                            : 'bg-purple-500'
                      }`}
                    ></div>
                    <span>{track.assetName}</span>
                  </div>
                ))
              })()}
          </div>
        </div>

        {/* Selected Word Info */}
        {focusedWord && (
          <div className="text-xs text-gray-600">
            선택된 단어:{' '}
            <span className="text-black font-medium">{focusedWord.text}</span>
            {(() => {
              const tracks = wordAnimationTracks.get(focusedWord.id) || []
              if (tracks.length > 0) {
                return (
                  <span className="ml-2">({tracks.length}/3 애니메이션)</span>
                )
              }
              return null
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
