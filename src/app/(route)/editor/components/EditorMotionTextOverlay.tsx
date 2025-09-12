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
          console.log(
            '[EditorMotionTextOverlay] Found video element from container'
          )
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
        console.log('[EditorMotionTextOverlay] Video element found after retry')
      }
    }, 100)

    // Cleanup after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval)
      console.warn(
        '[EditorMotionTextOverlay] Video element not found after 5 seconds'
      )
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
        console.log('[EditorMotionTextOverlay] Loaded manifest:', pluginName)
      } catch (e) {
        console.warn('[EditorMotionTextOverlay] Failed to load manifest', e)
      }
    }
    void ensureManifest()
    return () => {
      cancelled = true
    }
  }, [])

  const buildScenarioFromClips = useCallback((): RendererConfig => {
    console.log('[EditorMotionTextOverlay] Building scenario from clips:', {
      clipsCount: clips.length,
      deletedClipsCount: deletedClipIds.size,
      showSubtitles,
      subtitlePosition,
      subtitleSize,
    })

    const pluginName = (manifestRef.current?.key as string) || 'elastic@1.0.0'
    const rawParams = defaultParamsRef.current || {}
    const manifest = manifestRef.current
    const params = manifest
      ? validateAndNormalizeParams(rawParams, manifest)
      : rawParams

    console.log('[EditorMotionTextOverlay] Using plugin:', {
      pluginName,
      hasManifest: !!manifest,
      params,
    })

    // Map editor UI → positioning and font size (using relative coordinates like demo)
    const centerX = 0.5 // Always center horizontally
    const centerY = subtitlePosition === 'top' ? 0.15 : 0.85 // 15% from top or 85% from top (15% from bottom)

    const fontSizeRel =
      subtitleSize === 'small' ? 0.05 : subtitleSize === 'large' ? 0.09 : 0.07

    // Build cues for all non-deleted clips using adjusted time mapping
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
    let validClipsCount = 0
    for (const clip of clips) {
      if (deletedClipIds.has(clip.id)) continue
      const [startStr, endStr] = (clip.timeline || '').split(' → ')
      const s0 = toSec(startStr || '0:00')
      const s1 = toSec(endStr || '0:00')
      const adjStart = videoSegmentManager.mapToAdjustedTime(s0)
      const adjEnd = videoSegmentManager.mapToAdjustedTime(s1)
      if (adjStart == null || adjEnd == null) continue
      const text = clip.subtitle || clip.fullText || ''

      // Debug logging for text extraction
      console.log(`[EditorMotionTextOverlay] Processing clip ${clip.id}:`, {
        timeline: clip.timeline,
        originalTimes: { s0, s1 },
        adjustedTimes: { adjStart, adjEnd },
        subtitle: clip.subtitle,
        fullText: clip.fullText,
        finalText: text,
        textEmpty: !text.trim(),
      })

      validClipsCount++
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
                { name: pluginName, params, relStartPct: 0, relEndPct: 1 },
              ],
            },
          ],
        },
      })
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

    console.log('[EditorMotionTextOverlay] Generated scenario config:', {
      validClipsCount,
      totalCues: cues.length,
      config,
    })

    return config
  }, [subtitlePosition, subtitleSize, clips, deletedClipIds])

  // Option A: Load external scenario.json when requested
  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    )
    const useScenario =
      params.get('scenario') === '1' ||
      process.env.NEXT_PUBLIC_EDITOR_USE_SCENARIO === '1' ||
      process.env.NEXT_PUBLIC_EDITOR_USE_SCENARIO === 'true'

    console.log('[EditorMotionTextOverlay] External scenario check:', {
      urlParam: params.get('scenario'),
      envVar: process.env.NEXT_PUBLIC_EDITOR_USE_SCENARIO,
      useScenario,
    })

    if (!useScenario) return

    let cancelled = false
    const path =
      process.env.NEXT_PUBLIC_EDITOR_SCENARIO_PATH || '/scenario.json'
    console.log(
      '[EditorMotionTextOverlay] Loading external scenario from:',
      path
    )

    const load = async () => {
      try {
        const res = await fetch(path)
        console.log(
          '[EditorMotionTextOverlay] External scenario fetch response:',
          {
            ok: res.ok,
            status: res.status,
            statusText: res.statusText,
          }
        )
        if (!res.ok) return
        const json = (await res.json()) as RendererConfig
        console.log('[EditorMotionTextOverlay] Loaded external scenario:', {
          version: json.version,
          cuesCount: json.cues?.length || 0,
        })
        if (cancelled) return
        setUsingExternalScenario(true)
        await loadScenario(json)
        console.log('[EditorMotionTextOverlay] External scenario loaded')
        // Send scenario to parent for JSON editor
        if (onScenarioUpdate) {
          onScenarioUpdate(json)
        }
        // Controller will handle synchronization automatically
      } catch (e) {
        console.warn(
          '[EditorMotionTextOverlay] Failed to load external scenario',
          e
        )
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [loadScenario, onScenarioUpdate]) // Removed videoEl and seek from dependencies to prevent re-runs

  // Handle scenario override from JSON editor
  useEffect(() => {
    if (scenarioOverride && renderer) {
      console.log(
        '[EditorMotionTextOverlay] Applying scenario override from JSON editor'
      )
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

    console.log('[EditorMotionTextOverlay] Real.json scenario check:', {
      usingExternalScenario,
      isLoadingScenario,
      urlParam: params.get('scenario'),
      useReal,
      hasVideoEl: !!videoEl,
    })

    if (!useReal) return

    // Wait for video element to be available
    if (!videoEl) {
      console.log(
        '[EditorMotionTextOverlay] Waiting for video element before loading real.json scenario'
      )
      return
    }

    console.log('[EditorMotionTextOverlay] Loading real.json scenario...')
    setIsLoadingScenario(true)

    let cancelled = false
    const load = async () => {
      try {
        console.log('[EditorMotionTextOverlay] Fetching /real.json')
        const res = await fetch('/real.json')
        console.log('[EditorMotionTextOverlay] Real.json fetch response:', {
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
        })
        if (!res.ok) {
          throw new Error(
            `Failed to fetch real.json: ${res.status} ${res.statusText}`
          )
        }
        const real = (await res.json()) as RealJson
        console.log('[EditorMotionTextOverlay] Loaded real.json data:', {
          segmentsCount: real.segments?.length || 0,
          firstSegment: real.segments?.[0] || null,
        })
        if (cancelled) return

        const cfg = buildScenarioFromReal(real)
        console.log(
          '[EditorMotionTextOverlay] Generated scenario from real.json:',
          {
            version: cfg.version,
            cuesCount: cfg.cues?.length || 0,
            firstCue: cfg.cues?.[0] || null,
          }
        )

        console.log('[EditorMotionTextOverlay] About to load scenario...')
        await loadScenario(cfg)
        console.log('[EditorMotionTextOverlay] Scenario loaded successfully')

        // Send scenario to parent for JSON editor
        if (onScenarioUpdate) {
          onScenarioUpdate(cfg)
        }

        console.log('[EditorMotionTextOverlay] Real.json scenario loaded')
        // Controller will handle synchronization automatically
        setUsingExternalScenario(true)
      } catch (e) {
        console.error(
          '[EditorMotionTextOverlay] Failed to build scenario from real.json',
          e
        )
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

    console.log('[EditorMotionTextOverlay] Loading default scenario from clips')
    const config = buildScenarioFromClips()

    // Send current scenario to parent for JSON editor
    if (onScenarioUpdate) {
      onScenarioUpdate(config)
    }

    const t = setTimeout(() => {
      void loadScenario(config)
        .then(() => {
          console.log('[EditorMotionTextOverlay] Default scenario loaded')
          // Controller will handle synchronization automatically
        })
        .catch((e) => {
          console.warn(
            '[EditorMotionTextOverlay] loadScenario (default) failed',
            e
          )
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
      } catch (e) {
        console.error(
          '[EditorMotionTextOverlay] Failed to initialize MotionTextController:',
          e
        )
      }
    }

    void initController()

    return () => {
      cancelled = true
      if (controllerRef.current) {
        try {
          controllerRef.current.destroy()
          controllerRef.current = null
          console.log(
            '[EditorMotionTextOverlay] MotionTextController destroyed'
          )
        } catch (e) {
          console.error(
            '[EditorMotionTextOverlay] Error destroying controller:',
            e
          )
        }
      }
    }
  }, [videoEl, renderer, containerRef])

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
