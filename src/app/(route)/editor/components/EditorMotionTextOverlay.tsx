'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useMotionTextRenderer } from '@/app/shared/motiontext'
import { useEditorStore } from '../store'
import {
  loadPluginManifest,
  getDefaultParameters,
  validateAndNormalizeParams,
  type RendererConfig,
  type PluginManifest,
} from '@/app/shared/motiontext'
import { videoSegmentManager } from '@/utils/video/segmentManager'
import { buildScenarioFromReal, type RealJson } from '../utils/realToScenario'

interface EditorMotionTextOverlayProps {
  videoContainerRef: React.RefObject<HTMLDivElement | null>
  onScenarioUpdate?: (scenario: RendererConfig) => void
  scenarioOverride?: RendererConfig
}

/**
 * EditorMotionTextOverlay
 * - Mounts a MotionText renderer over the editor VideoPlayer
 * - Skeleton only: initializes renderer and attaches to the existing <video>
 * - Scenario loading is added in later milestones
 */
export default function EditorMotionTextOverlay({
  videoContainerRef,
  onScenarioUpdate,
  scenarioOverride,
}: EditorMotionTextOverlayProps) {
  const {
    containerRef,
    videoRef,
    renderer,
    initializeRenderer,
    loadScenario,
    seek,
    status,
    error,
  } = useMotionTextRenderer({ autoPlay: false, loop: false })

  // Editor store state
  const {
    clips,
    deletedClipIds,
    showSubtitles,
    subtitleSize,
    subtitlePosition,
    timeline,
    getSequentialClips,
  } = useEditorStore()

  // Internal plugin state
  const manifestRef = useRef<(PluginManifest & { key?: string }) | null>(null)
  const defaultParamsRef = useRef<Record<string, unknown> | null>(null)
  const isInitRef = useRef(false)
  const [usingExternalScenario, setUsingExternalScenario] = useState(false)
  const [isLoadingScenario, setIsLoadingScenario] = useState(false)

  // MotionTextController for automatic video-renderer synchronization
  const controllerRef = useRef<{ destroy: () => void } | null>(null)

  // Obtain the existing video element from the global video controller
  // Add retry mechanism for video element detection
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)

  useEffect(() => {
    const getVideoElement = () => {
      // Try to find video element from the container
      if (videoContainerRef?.current) {
        const video = videoContainerRef.current.querySelector('video')
        if (video) {
          return video
        }
      }

      // Fallback to global video player if available
      const vp = (
        window as unknown as {
          videoPlayer?: {
            getElement?: () => HTMLVideoElement | null
          }
        }
      ).videoPlayer
      return vp?.getElement ? vp.getElement() : null
    }

    // Initial attempt
    let el = getVideoElement()
    if (el) {
      setVideoEl(el)
      return
    }

    // Retry mechanism with polling
    const interval = setInterval(() => {
      el = getVideoElement()
      if (el) {
        setVideoEl(el)
        clearInterval(interval)
      }
    }, 100)

    // Cleanup after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval)
    }, 5000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [videoContainerRef])

  useEffect(() => {
    if (!videoRef || !containerRef) return
    if (videoEl) {
      // Attach existing video element to the hook before initialization
      ;(videoRef as React.MutableRefObject<HTMLVideoElement | null>).current =
        videoEl
      if (!isInitRef.current) {
        isInitRef.current = true
        void initializeRenderer()
      }
    }
  }, [initializeRenderer, videoEl, videoRef, containerRef])

  // Load default plugin manifest/params once
  useEffect(() => {
    let cancelled = false
    const ensureManifest = async () => {
      if (manifestRef.current) return
      try {
        const pluginName = 'elastic@1.0.0'
        const manifest = await loadPluginManifest(pluginName, {
          mode: 'local',
          localBase: '/plugin/',
        })
        if (cancelled) return
        manifestRef.current = {
          ...manifest,
          key: pluginName,
        } as PluginManifest & { key: string }
        defaultParamsRef.current = getDefaultParameters(manifest)
      } catch {
        // Ignore manifest loading errors
      }
    }
    void ensureManifest()
    return () => {
      cancelled = true
    }
  }, [])

  const buildScenarioFromClips = useCallback((): RendererConfig => {
    // Ensure manifest is loaded before building scenario
    const pluginName = (manifestRef.current?.key as string) || 'elastic@1.0.0'
    const rawParams = defaultParamsRef.current || {}
    const manifest = manifestRef.current
    const params = manifest
      ? validateAndNormalizeParams(rawParams, manifest)
      : rawParams

    console.log('[EditorMotionTextOverlay] Building scenario with:', {
      pluginName,
      hasManifest: !!manifest,
      manifestKey: manifestRef.current?.key,
      paramsKeys: Object.keys(params),
      sequentialMode: timeline.isSequentialMode,
    })

    // Safety check: ensure we have a valid plugin name
    if (!pluginName || pluginName === '') {
      console.error(
        '[EditorMotionTextOverlay] No valid plugin name found, using fallback'
      )
      const fallbackPluginName = 'elastic@1.0.0'
      return {
        version: '1.3',
        timebase: { unit: 'seconds' },
        stage: { baseAspect: '16:9' },
        tracks: [
          {
            id: 'editor',
            type: 'subtitle',
            layer: 1,
            defaultStyle: {
              fontSizeRel: 0.07,
              fontFamily: 'Arial, sans-serif',
              color: '#ffffff',
            },
          },
        ],
        cues: [],
      }
    }

    // Map editor UI → positioning and font size (using relative coordinates like demo)
    const centerX = 0.5 // Always center horizontally
    const centerY = subtitlePosition === 'top' ? 0.15 : 0.85 // 15% from top or 85% from top (15% from bottom)

    const fontSizeRel =
      subtitleSize === 'small' ? 0.05 : subtitleSize === 'large' ? 0.09 : 0.07

    // Build cues for sequential timeline mode or regular clips
    const toSec = (s: string) => {
      const parts = s.split(':').map(Number)
      if (parts.length === 3) {
        const [h, m, sec] = parts
        return (h || 0) * 3600 + (m || 0) * 60 + (sec || 0)
      }
      const [m, sec] = parts
      return (m || 0) * 60 + (sec || 0)
    }

    const cues = [] as RendererConfig['cues']

    // Build cues from timeline clips if in sequential mode, otherwise use original clip timing
    if (timeline.isSequentialMode) {
      // Sequential mode: use timeline clips with proper timing
      const timelineClips = getSequentialClips()
      console.log('[EditorMotionTextOverlay] Sequential mode debug:', {
        timelineClipsCount: timelineClips.length,
        clipOrder: timeline.clipOrder,
        clipOrderLength: timeline.clipOrder?.length || 0,
        clipsCount: clips.length,
        isSequentialMode: timeline.isSequentialMode,
        timelineClips: timelineClips.map((tc) => ({
          id: tc.id,
          sourceClipId: tc.sourceClipId,
          startTime: tc.startTime,
          duration: tc.duration,
        })),
      })

      // Safety check: if no timeline clips available, return early with diagnostic info
      if (timelineClips.length === 0) {
        console.warn(
          '[EditorMotionTextOverlay] No timeline clips available in sequential mode:',
          {
            clipOrder: timeline.clipOrder,
            originalClipsCount: clips.length,
            isSequentialMode: timeline.isSequentialMode,
            hasGetSequentialClips: typeof getSequentialClips === 'function',
          }
        )
      }

      for (const timelineClip of timelineClips) {
        if (deletedClipIds.has(timelineClip.id)) continue

        const adjStart = timelineClip.startTime
        const adjEnd = timelineClip.startTime + timelineClip.duration

        // Ensure valid timing (absEnd must be greater than absStart)
        if (adjEnd <= adjStart) {
          console.warn(
            `[EditorMotionTextOverlay] Skipping timeline clip ${timelineClip.id} - invalid timing: start=${adjStart}, end=${adjEnd}`
          )
          continue
        }

        // Find corresponding original clip to get text
        const originalClip = clips.find(
          (c) => c.id === timelineClip.sourceClipId
        )
        if (!originalClip) continue

        const text = originalClip.subtitle || originalClip.fullText || ''
        if (!text.trim()) continue

        // Process valid timeline clip
        cues.push({
          id: `cue-${timelineClip.id}`,
          track: 'editor',
          hintTime: { start: adjStart, end: adjEnd },
          root: {
            e_type: 'group',
            layout: {
              anchor: 'bc',
              position: { x: centerX, y: centerY },
              safeAreaClamp: true,
            },
            children: [
              {
                e_type: 'text',
                text,
                absStart: adjStart,
                absEnd: adjEnd,
                layout: {
                  anchor: 'bc',
                },
                pluginChain: [
                  {
                    name: pluginName, // Use the validated pluginName instead of potentially null manifestRef
                    params: params,
                  },
                ],
                textProps: {
                  fontSize: Math.round(360 * fontSizeRel), // 360 = stage height
                  fill: 'white',
                  fontFamily: 'sans-serif',
                  fontWeight: 'bold',
                  strokeColor: 'black',
                  strokeWidth: 2,
                  textAlign: 'center',
                  maxWidth: Math.round(640 * 0.88), // 88% of stage width
                },
              },
            ],
          },
        })
      }
    } else {
      // Regular mode: use original clip timing logic
      for (const clip of clips) {
        if (deletedClipIds.has(clip.id)) continue

        const [startStr, endStr] = (clip.timeline || '').split(' → ')
        const s0 = toSec(startStr || '0:00')
        const s1 = toSec(endStr || '0:00')
        const adjStart = videoSegmentManager.mapToAdjustedTime(s0)
        const adjEnd = videoSegmentManager.mapToAdjustedTime(s1)
        if (adjStart == null || adjEnd == null) continue

        // Ensure valid timing (absEnd must be greater than absStart)
        if (adjEnd <= adjStart) {
          console.warn(
            `[EditorMotionTextOverlay] Skipping clip ${clip.id} - invalid timing: start=${adjStart}, end=${adjEnd}`
          )
          continue
        }

        const text = clip.subtitle || clip.fullText || ''
        if (!text.trim()) continue

        // Process valid clip
        cues.push({
          id: `cue-${clip.id}`,
          track: 'editor',
          hintTime: { start: adjStart, end: adjEnd },
          root: {
            e_type: 'group',
            layout: {
              anchor: 'bc',
              position: { x: centerX, y: centerY },
              safeAreaClamp: true,
            },
            children: [
              {
                e_type: 'text',
                text,
                absStart: adjStart,
                absEnd: adjEnd,
                layout: {
                  anchor: 'bc',
                },
                pluginChain: [
                  {
                    name: pluginName, // Use the validated pluginName instead of potentially null manifestRef
                    params: params,
                  },
                ],
                textProps: {
                  fontSize: Math.round(360 * fontSizeRel), // 360 = stage height
                  fill: 'white',
                  fontFamily: 'sans-serif',
                  fontWeight: 'bold',
                  strokeColor: 'black',
                  strokeWidth: 2,
                  textAlign: 'center',
                  maxWidth: Math.round(640 * 0.88), // 88% of stage width
                },
              },
            ],
          },
        })
      }
    }

    const config: RendererConfig = {
      version: '1.3',
      timebase: { unit: 'seconds' },
      stage: { baseAspect: '16:9' },
      tracks: [
        {
          id: 'editor',
          type: 'subtitle',
          layer: 1,
          defaultStyle: {
            fontSizeRel,
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
          },
        },
      ],
      cues,
    }

    // Debug logging to check plugin chain structure
    const firstCueChildren = cues[0]?.root?.children as
      | Array<Record<string, unknown>>
      | undefined
    const firstCuePluginChain = firstCueChildren?.[0]?.pluginChain as
      | Array<Record<string, unknown>>
      | undefined
    console.log('[EditorMotionTextOverlay] Generated config:', {
      isSequentialMode: timeline.isSequentialMode,
      cuesCount: cues.length,
      firstCue: cues[0],
      pluginChain: firstCuePluginChain?.[0],
    })

    // Safety check: ensure all cues have valid plugin chains
    const validCues = cues.filter((cue, index) => {
      const children = cue.root?.children as
        | Array<Record<string, unknown>>
        | undefined
      const pluginChain = children?.[0]?.pluginChain as
        | Array<Record<string, unknown>>
        | undefined
      const firstPlugin = pluginChain?.[0] as Record<string, unknown>

      // Enhanced validation
      if (!firstPlugin) {
        console.warn(
          '[EditorMotionTextOverlay] Skipping cue with missing plugin:',
          { cueId: cue.id, index, children, pluginChain }
        )
        return false
      }

      if (
        !firstPlugin.name ||
        (typeof firstPlugin.name === 'string' && firstPlugin.name.trim() === '')
      ) {
        console.warn(
          '[EditorMotionTextOverlay] Skipping cue with invalid plugin name:',
          {
            cueId: cue.id,
            index,
            pluginName: firstPlugin.name,
            plugin: firstPlugin,
          }
        )
        return false
      }

      // Validate timing
      if (!cue.hintTime || !cue.hintTime.start || !cue.hintTime.end) {
        console.warn(
          '[EditorMotionTextOverlay] Skipping cue with invalid timing:',
          {
            cueId: cue.id,
            index,
            hintTime: cue.hintTime,
          }
        )
        return false
      }

      return true
    })

    if (validCues.length === 0) {
      console.warn(
        '[EditorMotionTextOverlay] No valid cues found, returning empty config',
        {
          totalCuesGenerated: cues.length,
          validCuesCount: validCues.length,
          isSequentialMode: timeline.isSequentialMode,
          clipOrder: timeline.clipOrder,
          clipsCount: clips.length,
          deletedClipIdsCount: deletedClipIds.size,
          pluginName: pluginName,
          hasManifest: !!manifestRef.current,
          manifestKey: manifestRef.current?.key,
          reasonsForFailure:
            'Check console for individual cue validation failures above',
        }
      )
      return {
        ...config,
        cues: [],
      }
    }

    return {
      ...config,
      cues: validCues,
    }
  }, [
    subtitlePosition,
    subtitleSize,
    clips,
    deletedClipIds,
    timeline,
    // timeline.lastUpdated, // Unnecessary dependency - timeline object change is sufficient
    getSequentialClips,
  ])

  // Option A: Load external scenario.json when requested (disabled for sequential timeline)
  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    )
    const useScenario =
      params.get('scenario') === '1' ||
      process.env.NEXT_PUBLIC_EDITOR_USE_SCENARIO === '1' ||
      process.env.NEXT_PUBLIC_EDITOR_USE_SCENARIO === 'true'

    // Disable external scenario loading when using sequential timeline
    if (!useScenario || timeline.isSequentialMode) return

    let cancelled = false
    const path =
      process.env.NEXT_PUBLIC_EDITOR_SCENARIO_PATH || '/scenario.json'

    const load = async () => {
      try {
        const res = await fetch(path)
        if (!res.ok) return
        const json = (await res.json()) as RendererConfig
        if (cancelled) return
        setUsingExternalScenario(true)
        await loadScenario(json)
        // Send scenario to parent for JSON editor
        if (onScenarioUpdate) {
          onScenarioUpdate(json)
        }
        // Controller will handle synchronization automatically
      } catch {
        // Ignore scenario loading errors
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [loadScenario, onScenarioUpdate, timeline.isSequentialMode]) // Added timeline dependency for sequential mode check

  // Handle scenario override from JSON editor
  useEffect(() => {
    if (scenarioOverride && renderer) {
      void loadScenario(scenarioOverride)
    }
  }, [scenarioOverride, renderer, loadScenario])

  // Option B: Convert real.json to scenario on the fly when requested
  useEffect(() => {
    if (usingExternalScenario || isLoadingScenario || scenarioOverride) return
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    )
    const useReal = params.get('scenario') === 'real'

    if (!useReal) return

    // Wait for video element to be available
    if (!videoEl) {
      return
    }

    setIsLoadingScenario(true)

    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/real.json')
        if (!res.ok) {
          throw new Error(
            `Failed to fetch real.json: ${res.status} ${res.statusText}`
          )
        }
        const real = (await res.json()) as RealJson
        if (cancelled) return

        const cfg = buildScenarioFromReal(real)

        await loadScenario(cfg)

        // Send scenario to parent for JSON editor
        if (onScenarioUpdate) {
          onScenarioUpdate(cfg)
        }

        // Controller will handle synchronization automatically
        setUsingExternalScenario(true)
      } catch {
        // Ignore real.json loading errors
      } finally {
        setIsLoadingScenario(false)
      }
    }
    void load()
    return () => {
      cancelled = true
      setIsLoadingScenario(false)
    }
  }, [
    usingExternalScenario,
    isLoadingScenario,
    scenarioOverride,
    videoEl,
    loadScenario,
    seek,
    onScenarioUpdate,
  ])

  // Load a multi-cue scenario for all visible clips (default path)
  useEffect(() => {
    if (usingExternalScenario || isLoadingScenario || scenarioOverride) return
    if (!showSubtitles) return

    // Wait for manifest to be loaded before building scenarios
    if (!manifestRef.current?.key) {
      console.log(
        '[EditorMotionTextOverlay] Waiting for manifest to load before building scenario'
      )
      return
    }

    const config = buildScenarioFromClips()

    // Send current scenario to parent for JSON editor
    if (onScenarioUpdate) {
      onScenarioUpdate(config)
    }

    const t = setTimeout(() => {
      void loadScenario(config)
        .then(() => {
          // Controller will handle synchronization automatically
        })
        .catch(() => {
          // Ignore scenario loading errors
        })
    }, 120)
    return () => clearTimeout(t)
  }, [
    buildScenarioFromClips,
    showSubtitles,
    loadScenario,
    seek,
    usingExternalScenario,
    isLoadingScenario,
    onScenarioUpdate,
    scenarioOverride,
  ]) // Removed videoEl from dependencies

  // Initialize MotionTextController when renderer and video are ready
  useEffect(() => {
    if (!videoEl || !renderer || !containerRef?.current) return

    // Only initialize controller once
    if (controllerRef.current) return

    let cancelled = false

    const initController = async () => {
      try {
        const { MotionTextController } = await import('motiontext-renderer')

        if (cancelled) return

        const controller = new MotionTextController(
          videoEl,
          renderer,
          videoContainerRef.current ||
            containerRef.current!.parentElement ||
            containerRef.current!,
          { captionsVisible: true }
        )
        controller.mount()
        controllerRef.current = controller
      } catch {
        // Ignore controller initialization errors
      }
    }

    void initController()

    return () => {
      cancelled = true
      if (controllerRef.current) {
        try {
          controllerRef.current.destroy()
          controllerRef.current = null
        } catch {
          // Ignore controller cleanup errors
        }
      }
    }
  }, [videoEl, renderer, containerRef, videoContainerRef])

  if (!showSubtitles) {
    return null
  }

  return (
    <div className="absolute inset-0" aria-label="motiontext-overlay">
      <div ref={containerRef} className="w-full h-full pointer-events-none" />
      {/* Lightweight debug status (non-interactive) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-1 right-2 text-[10px] text-white/70 bg-black/50 px-1 rounded">
          {status}
          {error ? ` · ${error}` : ''}
          {usingExternalScenario && ' · EXT'}
          {isLoadingScenario && ' · LOADING'}
          {!videoEl && ' · NO_VIDEO'}
        </div>
      )}
    </div>
  )
}
