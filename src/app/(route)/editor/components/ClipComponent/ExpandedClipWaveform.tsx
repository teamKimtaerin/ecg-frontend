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

// Load and process audio data from real.json
async function loadClipAudioData(words: Word[]) {
  try {
    const response = await fetch('/real.json')
    const data = await response.json()

    // Extract volume data for all words in this clip
    const volumeData: number[] = []
    const samplesPerWord = 20 // How many samples per word for smooth visualization

    for (const word of words) {
      // Find word data from segments
      let wordVolume = -20 // Default volume

      for (const segment of data.segments) {
        const wordData = segment.words?.find(
          (w: { word: string; start: number }) =>
            w.word === word.text && Math.abs(w.start - word.start) < 0.1 // Match by text and approximate timing
        )
        if (wordData && wordData.volume_db !== undefined) {
          wordVolume = wordData.volume_db
          break
        }
      }

      // Generate samples for this word with some variation
      for (let i = 0; i < samplesPerWord; i++) {
        const variation = (Math.random() - 0.5) * 2 // Small random variation
        volumeData.push(wordVolume + variation)
      }
    }

    // Normalize volume data to 0-1 range for waveform peaks
    const minDb = -40
    const maxDb = 0
    const peaks = volumeData.map((db) => {
      const normalized = (db - minDb) / (maxDb - minDb)
      return Math.max(0, Math.min(1, normalized))
    })

    return peaks
  } catch (error) {
    console.error('Failed to load audio data:', error)
    // Generate fallback waveform data
    const totalSamples = words.length * 20
    return Array.from({ length: totalSamples }, () => Math.random() * 0.8 + 0.2)
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
      waveColor: '#4D4D59',
      progressColor: '#00B4D8',
      cursorColor: '#FF006E',
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
          } else if (barType === 'min') {
            const newMin = Math.min(position, track.intensity.max - 0.05)
            updateAnimationTrackIntensity(
              draggedWordId,
              assetId,
              newMin,
              track.intensity.max
            )
            setHasUnsavedChanges(true)
          } else if (barType === 'max') {
            const newMax = Math.max(position, track.intensity.min + 0.05)
            updateAnimationTrackIntensity(
              draggedWordId,
              assetId,
              track.intensity.min,
              newMax
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
    <div className="w-full bg-[#2A2A33] border-t border-[#383842] animate-in slide-in-from-top duration-200">
      {/* Waveform Container */}
      <div className="relative bg-[#1A1A22] mx-4 my-3 rounded-lg p-4 pt-8">
        {/* Red center line */}
        <div
          className="absolute left-0 right-0 top-1/2 h-px bg-red-500 opacity-40 pointer-events-none z-10"
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
                  isSelected ? 'text-blue-400 font-semibold' : 'text-gray-500'
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

            return (
              <React.Fragment key={focusedWord.id}>
                {/* Timing Bars (White for focused word) - Top */}
                <div
                  className="absolute top-0 w-1 cursor-ew-resize transition-colors z-30 bg-white hover:bg-gray-300"
                  style={{
                    left: `${getBarPosition(timing.start) * 100}%`,
                    transform: 'translateX(-50%)',
                    height: '40%',
                  }}
                  onMouseDown={(e) =>
                    handleDragStart(focusedWord.id, 'timing-start', e)
                  }
                  title={`${focusedWord.text} 시작: ${timing.start.toFixed(2)}s`}
                ></div>

                <div
                  className="absolute top-0 w-1 cursor-ew-resize transition-colors z-30 bg-white hover:bg-gray-300"
                  style={{
                    left: `${getBarPosition(timing.end) * 100}%`,
                    transform: 'translateX(-50%)',
                    height: '40%',
                  }}
                  onMouseDown={(e) =>
                    handleDragStart(focusedWord.id, 'timing-end', e)
                  }
                  title={`${focusedWord.text} 종료: ${timing.end.toFixed(2)}s`}
                ></div>

                {/* Animation Track Bars - Multiple tracks per word (max 3) */}
                {(() => {
                  const tracks = wordAnimationTracks.get(focusedWord.id) || []
                  const trackColors = {
                    blue: {
                      base: 'bg-blue-500',
                      hover: 'bg-blue-400',
                      label: 'bg-blue-600',
                    },
                    green: {
                      base: 'bg-green-500',
                      hover: 'bg-green-400',
                      label: 'bg-green-600',
                    },
                    purple: {
                      base: 'bg-purple-500',
                      hover: 'bg-purple-400',
                      label: 'bg-purple-600',
                    },
                  }

                  return tracks.map((track, trackIndex) => {
                    const colors = trackColors[track.color]
                    const bottomOffset = 40 + trackIndex * 15 // Stack tracks vertically

                    return (
                      <React.Fragment
                        key={`${focusedWord.id}-${track.assetId}`}
                      >
                        {/* Track timing start */}
                        <div
                          className={`absolute w-1 cursor-ew-resize transition-colors z-30 ${colors.base} hover:${colors.hover}`}
                          style={{
                            left: `${getBarPosition(track.timing.start) * 100}%`,
                            transform: 'translateX(-50%)',
                            bottom: `${bottomOffset}%`,
                            height: '12%',
                          }}
                          onMouseDown={(e) =>
                            handleDragStart(
                              focusedWord.id,
                              `track-${track.assetId}-start`,
                              e
                            )
                          }
                          title={`${track.assetName} 시작: ${track.timing.start.toFixed(2)}s`}
                        >
                          <div
                            className={`absolute -bottom-6 left-1/2 -translate-x-1/2 ${colors.label} text-white text-xs px-2 py-1 rounded whitespace-nowrap`}
                          >
                            {track.assetName.split(' ')[0]} 시작
                          </div>
                        </div>

                        {/* Track timing end */}
                        <div
                          className={`absolute w-1 cursor-ew-resize transition-colors z-30 ${colors.base} hover:${colors.hover}`}
                          style={{
                            left: `${getBarPosition(track.timing.end) * 100}%`,
                            transform: 'translateX(-50%)',
                            bottom: `${bottomOffset}%`,
                            height: '12%',
                          }}
                          onMouseDown={(e) =>
                            handleDragStart(
                              focusedWord.id,
                              `track-${track.assetId}-end`,
                              e
                            )
                          }
                          title={`${track.assetName} 종료: ${track.timing.end.toFixed(2)}s`}
                        >
                          <div
                            className={`absolute -bottom-6 left-1/2 -translate-x-1/2 ${colors.label} text-white text-xs px-2 py-1 rounded whitespace-nowrap`}
                          >
                            {track.assetName.split(' ')[0]} 종료
                          </div>
                        </div>

                        {/* Track intensity min */}
                        <div
                          className={`absolute w-1 cursor-ew-resize transition-colors z-30 ${colors.base} hover:${colors.hover}`}
                          style={{
                            left: `${track.intensity.min * 100}%`,
                            transform: 'translateX(-50%)',
                            bottom: `${bottomOffset - 15}%`,
                            height: '12%',
                          }}
                          onMouseDown={(e) =>
                            handleDragStart(
                              focusedWord.id,
                              `track-${track.assetId}-min`,
                              e
                            )
                          }
                          title={`${track.assetName} 최소: ${(track.intensity.min * 100).toFixed(0)}%`}
                        />

                        {/* Track intensity max */}
                        <div
                          className={`absolute w-1 cursor-ew-resize transition-colors z-30 ${colors.base} hover:${colors.hover}`}
                          style={{
                            left: `${track.intensity.max * 100}%`,
                            transform: 'translateX(-50%)',
                            bottom: `${bottomOffset - 15}%`,
                            height: '12%',
                          }}
                          onMouseDown={(e) =>
                            handleDragStart(
                              focusedWord.id,
                              `track-${track.assetId}-max`,
                              e
                            )
                          }
                          title={`${track.assetName} 최대: ${(track.intensity.max * 100).toFixed(0)}%`}
                        />
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
            className="p-2 bg-[#383842] hover:bg-[#4D4D59] rounded transition-colors"
            title={isPlaying ? '일시정지' : '재생'}
            disabled={!focusedWord}
          >
            {isPlaying ? (
              <IoPause size={18} className="text-[#F2F2F2]" />
            ) : (
              <IoPlay size={18} className="text-[#F2F2F2]" />
            )}
          </button>

          {/* Undo Button */}
          <button
            onClick={handleUndo}
            className="p-2 bg-[#383842] hover:bg-[#4D4D59] rounded transition-colors"
            title="되돌리기"
            disabled={!focusedWord}
          >
            <IoArrowUndo size={18} className="text-[#F2F2F2]" />
          </button>

          {/* Redo Button */}
          <button
            onClick={handleRedo}
            className="p-2 bg-[#383842] hover:bg-[#4D4D59] rounded transition-colors"
            title="다시 실행"
            disabled={!focusedWord}
          >
            <IoArrowRedo size={18} className="text-[#F2F2F2]" />
          </button>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-[#9999A6]">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-white rounded-sm"></div>
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
          <div className="text-xs text-[#9999A6]">
            선택된 단어:{' '}
            <span className="text-white font-medium">{focusedWord.text}</span>
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
