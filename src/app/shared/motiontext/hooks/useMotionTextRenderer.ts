/**
 * Motion Text Renderer 통합 훅 (shared)
 * - 렌더러 인스턴스 관리, 시나리오 로딩, seek 동기화 등
 */

import { useRef, useCallback, useEffect, useState } from 'react'
import type { MotionTextRenderer as MTRuntime } from 'motiontext-renderer'
import type { RendererConfig } from '../utils/scenarioGenerator'
import {
  preloadPluginsForScenario,
  preloadAllPlugins,
  configurePluginLoader,
} from '../utils/pluginLoader'

interface MotionTextRendererHookOptions {
  autoPlay?: boolean
  loop?: boolean
  onError?: (error: Error) => void
  onStatusChange?: (status: string) => void
}

interface MotionTextRendererState {
  isLoading: boolean
  isPlaying: boolean
  currentTime: number
  duration: number
  error: string | null
  status: string
}

export function useMotionTextRenderer(
  options: MotionTextRendererHookOptions = {}
) {
  const { autoPlay = true, loop = true, onError, onStatusChange } = options

  // Refs
  const rendererRef = useRef<MTRuntime | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentConfigRef = useRef<RendererConfig | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  // Stable refs for options to avoid dependency issues
  const autoPlayRef = useRef(autoPlay)
  const loopRef = useRef(loop)
  const isPlayingRef = useRef(false)

  // State
  const [state, setState] = useState<MotionTextRendererState>({
    isLoading: false,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    error: null,
    status: 'idle',
  })

  // Update refs when options change
  useEffect(() => {
    autoPlayRef.current = autoPlay
    loopRef.current = loop
  }, [autoPlay, loop])

  // Update isPlayingRef when state changes
  useEffect(() => {
    isPlayingRef.current = state.isPlaying
  }, [state.isPlaying])

  const updateState = useCallback(
    (updates: Partial<MotionTextRendererState>) => {
      setState((prev) => {
        const newState = { ...prev, ...updates }
        if (updates.status && onStatusChange) {
          onStatusChange(updates.status)
        }
        return newState
      })
    },
    [onStatusChange]
  )

  const handleError = useCallback(
    (error: Error) => {
      console.error('MotionTextRenderer Error:', error)
      updateState({ error: error.message, isLoading: false, status: 'error' })
      if (onError) onError(error)
    },
    [onError, updateState]
  )

  const initializeRenderer = useCallback(async () => {
    if (!containerRef.current) return
    try {
      updateState({ isLoading: true, status: 'initializing' })
      const gsap = await import('gsap')
      if (typeof window !== 'undefined' && gsap) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(window as any).gsap = (gsap as any).default || gsap
      }
      configurePluginLoader()
      await preloadAllPlugins()
      const { MotionTextRenderer } = await import('motiontext-renderer')
      rendererRef.current = new MotionTextRenderer(containerRef.current)
      if (videoRef.current) {
        rendererRef.current.attachMedia(videoRef.current)
      }
      updateState({ isLoading: false, status: 'ready', error: null })
    } catch (error) {
      handleError(error as Error)
    }
  }, [updateState, handleError])

  const loadScenario = useCallback(
    async (config: RendererConfig, opts?: { silent?: boolean }) => {
      if (!rendererRef.current) await initializeRenderer()
      if (!rendererRef.current) throw new Error('Failed to initialize renderer')
      try {
        if (!opts?.silent) {
          updateState({
            isLoading: true,
            status: 'loading scenario',
            error: null,
          })
        }
        // Clean up existing timeout
        if (loopTimeoutRef.current) {
          clearTimeout(loopTimeoutRef.current)
          loopTimeoutRef.current = null
        }

        // Validate config structure
        if (!config || typeof config !== 'object') {
          throw new Error('Invalid config: config must be an object')
        }

        // Preload plugins with error handling
        try {
          await preloadPluginsForScenario(config)
        } catch (pluginError) {
          console.warn('Plugin preload failed:', pluginError)
          // Continue execution - plugin errors shouldn't be fatal
        }

        // Load config with renderer validation
        if (!rendererRef.current) {
          throw new Error('Renderer is not available')
        }

        if (typeof rendererRef.current.loadConfig !== 'function') {
          throw new Error('Renderer loadConfig method is not available')
        }

        await rendererRef.current.loadConfig(config)
        currentConfigRef.current = config
        if (autoPlayRef.current) {
          try {
            void play()
          } catch {}
        }
        updateState({
          isLoading: false,
          status: 'loaded',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          duration: (config.cues?.[0]?.root as any)?.absEnd || 3,
        })
      } catch (error) {
        handleError(error as Error)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initializeRenderer, updateState, handleError]
  )

  const play = useCallback(async () => {
    if (!rendererRef.current) return
    try {
      rendererRef.current.play()
      startTimeRef.current = performance.now()
      const duration = currentConfigRef.current?.cues?.[0]?.root?.absEnd || 3
      isPlayingRef.current = true
      updateState({ isPlaying: true, status: 'playing', currentTime: 0 })
      const updateFrame = () => {
        if (!isPlayingRef.current || !rendererRef.current) return
        const elapsed = (performance.now() - startTimeRef.current) / 1000
        const loopedTime = elapsed % Number(duration || 3)
        try {
          rendererRef.current.seek(loopedTime)
          updateState({ currentTime: loopedTime })
        } catch (seekError) {
          console.warn('[useMotionTextRenderer] Seek error:', seekError)
        }
        animationFrameRef.current = requestAnimationFrame(updateFrame)
      }
      animationFrameRef.current = requestAnimationFrame(updateFrame)
    } catch (error) {
      console.error('[useMotionTextRenderer] Play error:', error)
      handleError(error as Error)
    }
  }, [updateState, handleError])

  const pause = useCallback(() => {
    if (!rendererRef.current) return
    try {
      rendererRef.current.pause()
      isPlayingRef.current = false
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      updateState({ isPlaying: false, status: 'paused' })
    } catch (error) {
      handleError(error as Error)
    }
  }, [updateState, handleError])

  const restart = useCallback(() => {
    if (!rendererRef.current || !isPlayingRef.current) return
    try {
      startTimeRef.current = performance.now()
      rendererRef.current.seek(0)
      updateState({ currentTime: 0 })
    } catch (error) {
      handleError(error as Error)
    }
  }, [updateState, handleError])

  const seek = useCallback((timeSec: number) => {
    if (!rendererRef.current) return
    try {
      rendererRef.current.seek(Math.max(0, Number(timeSec) || 0))
    } catch (error) {
      console.warn('[useMotionTextRenderer] Seek error:', error)
    }
  }, [])

  const dispose = useCallback(() => {
    if (rendererRef.current) {
      rendererRef.current.dispose()
      rendererRef.current = null
    }
    if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    currentConfigRef.current = null
    updateState({ isPlaying: false, status: 'disposed' })
  }, [updateState])

  useEffect(() => () => dispose(), [dispose])

  return {
    containerRef,
    videoRef,
    renderer: rendererRef.current,
    ...state,
    initializeRenderer,
    loadScenario,
    play,
    pause,
    restart,
    seek,
    dispose,
  }
}
