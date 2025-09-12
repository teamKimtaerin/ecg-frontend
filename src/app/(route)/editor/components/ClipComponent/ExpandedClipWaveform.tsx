import React, { useRef, useEffect, useState, useCallback } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { useEditorStore } from '../../store'
import { IoPlay, IoPause, IoArrowUndo, IoArrowRedo } from 'react-icons/io5'
import { Word } from './types'

interface ExpandedClipWaveformProps {
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

// Load and process audio data from real.json for a specific time range
async function loadRangeAudioData(
  startTime: number,
  endTime: number,
  displayWords: Word[]
) {
  try {
    const response = await fetch('/real.json')
    const data = await response.json()

    // Extract volume data for the time range
    const volumeData: number[] = []
    const sampleRate = 100 // Simulated sample rate (samples per second)
    const duration = endTime - startTime
    const totalSamples = Math.max(100, Math.ceil(duration * sampleRate))

    for (let i = 0; i < totalSamples; i++) {
      const currentTime = startTime + (i / totalSamples) * duration

      // Find the word that contains this time point
      let currentVolume = -20 // Default volume
      let currentPitch = 440 // Default pitch for variation

      const containingWord = displayWords.find(
        (word) => currentTime >= word.start && currentTime <= word.end
      )

      if (containingWord) {
        // Find volume data from segments
        for (const segment of data.segments) {
          const wordData = segment.words?.find(
            (w: { word: string; start: number }) =>
              w.word === containingWord.text &&
              Math.abs(w.start - containingWord.start) < 0.1
          )
          if (wordData && wordData.volume_db !== undefined) {
            currentVolume = wordData.volume_db
            currentPitch = wordData.pitch_hz || 440
            break
          }
        }
      }

      // Add natural variation based on frequency and time
      const timeOffset = currentTime * 2 * Math.PI
      const naturalVariation =
        Math.sin((timeOffset * currentPitch) / 1000) * 0.3 + // Primary frequency component
        Math.sin((timeOffset * currentPitch) / 500) * 0.2 + // Harmonic
        Math.sin(timeOffset * 0.5) * 0.1 // Low frequency modulation

      volumeData.push(currentVolume + naturalVariation)
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
    const totalSamples = Math.max(100, Math.ceil((endTime - startTime) * 50))
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

  // Calculate focused word range (3 words: previous + current + next)
  const { displayWords, rangeStart, rangeEnd, rangeDuration } =
    React.useMemo(() => {
      if (!focusedWord) {
        return {
          displayWords: words,
          rangeStart: words.length > 0 ? words[0].start : 0,
          rangeEnd: words.length > 0 ? words[words.length - 1].end : 0,
          rangeDuration:
            words.length > 0 ? words[words.length - 1].end - words[0].start : 0,
        }
      }

      const focusedIndex = words.findIndex((w) => w.id === focusedWord.id)
      if (focusedIndex === -1) {
        return {
          displayWords: words,
          rangeStart: words.length > 0 ? words[0].start : 0,
          rangeEnd: words.length > 0 ? words[words.length - 1].end : 0,
          rangeDuration:
            words.length > 0 ? words[words.length - 1].end - words[0].start : 0,
        }
      }

      // Get previous, current, and next words (3 words total)
      const prevWord = focusedIndex > 0 ? words[focusedIndex - 1] : null
      const currentWord = words[focusedIndex]
      const nextWord =
        focusedIndex < words.length - 1 ? words[focusedIndex + 1] : null

      // Calculate display range with padding for missing words
      let start = currentWord.start
      let end = currentWord.end
      const paddingTime = 1.0 // 1 second padding

      if (prevWord) {
        start = prevWord.start
      } else {
        // Add padding before current word if no previous word
        start = Math.max(0, currentWord.start - paddingTime)
      }

      if (nextWord) {
        end = nextWord.end
      } else {
        // Add padding after current word if no next word
        end = currentWord.end + paddingTime
      }

      // Build display words array
      const displayWords = [prevWord, currentWord, nextWord].filter(
        Boolean
      ) as Word[]

      return {
        displayWords,
        rangeStart: start,
        rangeEnd: end,
        rangeDuration: end - start,
      }
    }, [focusedWord, words])

  // Load audio data for the focused range
  useEffect(() => {
    loadRangeAudioData(rangeStart, rangeEnd, displayWords).then((data) => {
      setPeaks(data)
    })
  }, [rangeStart, rangeEnd, displayWords])

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
    ws.load('', [peaks], rangeDuration)

    wavesurferRef.current = ws

    // Cleanup
    return () => {
      ws.destroy()
    }
  }, [peaks, rangeDuration])

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

  // Calculate bar positions (0-1 scale) relative to focused range
  const getBarPosition = useCallback(
    (time: number) => {
      if (rangeDuration === 0) return 0
      const position = (time - rangeStart) / rangeDuration
      return Math.max(0, Math.min(1, position))
    },
    [rangeStart, rangeDuration]
  )

  // Handle drag start for word bars
  const handleDragStart = useCallback(
    (wordId: string, barType: string, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDraggedWordId(wordId)
      setDragType(barType)
      setIsDragging(true)
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
      const time = rangeStart + position * rangeDuration

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
            const newStart =
              rangeStart + position * rangeDuration - duration / 2

            // Constrain within range bounds
            const constrainedStart = Math.max(
              rangeStart,
              Math.min(newStart, rangeEnd - duration)
            )
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
    rangeStart,
    rangeDuration,
    rangeEnd,
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

        {/* Word boundaries - vertical lines for each word in focused range */}
        {displayWords.map((word) => {
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
