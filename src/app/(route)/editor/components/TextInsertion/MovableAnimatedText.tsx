'use client'

import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import Moveable, { OnDrag, OnResize, OnRotate } from 'react-moveable'
import { useMotionTextRenderer } from '@/app/shared/motiontext'
import type { RendererConfig } from '@/app/shared/motiontext'
import {
  generateLoopedScenario,
  loadPluginManifest,
  getDefaultParameters,
  validateAndNormalizeParams,
  type PluginManifest,
  type PreviewSettings,
} from '@/app/shared/motiontext'
import type { InsertedText } from '../../types/textInsertion'

interface MovableAnimatedTextProps {
  text: InsertedText
  isSelected: boolean
  isVisible: boolean
  videoContainerRef: React.RefObject<HTMLDivElement | null>
  onUpdate: (updates: Partial<InsertedText>) => void
  onSelect: () => void
  onDoubleClick: () => void
}

export interface MovableAnimatedTextRef {
  updateAnimation: (animationConfig: RendererConfig) => void
}

const MovableAnimatedText = forwardRef<MovableAnimatedTextRef, MovableAnimatedTextProps>(({
  text,
  isSelected,
  isVisible,
  videoContainerRef,
  onUpdate,
  onSelect,
  onDoubleClick,
}, ref) => {
  const textRef = useRef<HTMLDivElement>(null)
  
  const [isDragging, setIsDragging] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)
  const [showSimpleText, setShowSimpleText] = useState(false)
  const [, setCurrentConfig] = useState<RendererConfig | null>(null)
  const [manifest, setManifest] = useState<PluginManifest | null>(null)
  const [position, setPosition] = useState({ x: text.position.x, y: text.position.y })
  const [size, setSize] = useState({ width: 240, height: 80 })
  const [rotationDeg, setRotationDeg] = useState(0)
  
  // Stage size management (640x360 base)
  const stageSizeRef = useRef<{ width: number; height: number }>({ width: 640, height: 360 })
  const hasScaledFromInitialRef = useRef(false)
  const updateTimerRef = useRef<number | null>(null)
  const firstLoadDoneRef = useRef(false)

  // Use motion text renderer hook
  const { containerRef: motionContainerRef, loadScenario, play, pause } = useMotionTextRenderer({
    autoPlay: true,
    loop: true,
  })

  /**
   * Load plugin manifest
   */
  useEffect(() => {
    const loadManifest = async () => {
      if (!text.animation?.plugin) return
      
      try {
        const pluginName = text.animation.plugin.split('@')[0]
        const loadedManifest = await loadPluginManifest(pluginName)
        setManifest(loadedManifest)
      } catch (error) {
        console.error('Failed to load manifest:', error)
      }
    }

    loadManifest()
  }, [text.animation?.plugin])

  /**
   * Update scenario with proper coordinate normalization
   */
  const updateScenario = useCallback(async () => {
    if (!manifest || isDragging) return

    try {
      const STAGE_W = stageSizeRef.current.width
      const STAGE_H = stageSizeRef.current.height

      // Calculate proportional font size based on box dimensions
      const avgDimension = (size.width + size.height) / 2
      const fontSizeRel = Math.max(
        0.03,
        Math.min(0.15, (avgDimension / STAGE_W) * 0.15)
      )

      const validatedParams = text.animation?.parameters ? 
        validateAndNormalizeParams(text.animation.parameters, manifest) :
        getDefaultParameters(manifest)

      const settings: PreviewSettings = {
        text: text.content,
        position,
        size,
        pluginParams: validatedParams,
        rotationDeg,
        fontSizeRel,
      }

      // Convert current stage space to generator's 640x360 base for normalization
      const baseW = 640
      const baseH = 360
      const scaleX = baseW / STAGE_W
      const scaleY = baseH / STAGE_H
      const settingsForGenerator = {
        ...settings,
        position: {
          x: settings.position.x * scaleX,
          y: settings.position.y * scaleY,
        },
        size: {
          width: settings.size.width * scaleX,
          height: settings.size.height * scaleY,
        },
      }

      const scenario = generateLoopedScenario(
        text.animation?.plugin || 'fadein@1.0.0',
        settingsForGenerator,
        Math.max(1, text.endTime - text.startTime)
      )
      
      setCurrentConfig(scenario)
      await loadScenario(scenario, { silent: firstLoadDoneRef.current })
      
      // Auto-play on first load
      if (!firstLoadDoneRef.current && !isSelected) {
        play()
      }
      firstLoadDoneRef.current = true
    } catch (error) {
      console.error('Failed to update scenario:', error)
    }
  }, [manifest, text, position, size, rotationDeg, isDragging, loadScenario, play, isSelected])

  /**
   * Debounced scenario update (except during drag)
   */
  useEffect(() => {
    if (isDragging) return

    if (updateTimerRef.current) {
      window.clearTimeout(updateTimerRef.current)
      updateTimerRef.current = null
    }

    const delay = 50
    updateTimerRef.current = window.setTimeout(() => {
      void updateScenario()
    }, delay)

    return () => {
      if (updateTimerRef.current) {
        window.clearTimeout(updateTimerRef.current)
        updateTimerRef.current = null
      }
    }
  }, [manifest, position, size, rotationDeg, isDragging, updateScenario])

  /**
   * Text content change (separate debounce)
   */
  useEffect(() => {
    if (isDragging) return

    const textUpdateTimerRef = window.setTimeout(() => {
      void updateScenario()
    }, 200)

    return () => {
      window.clearTimeout(textUpdateTimerRef)
    }
  }, [text.content, isDragging, updateScenario])

  // Update animation config (exposed API)
  const updateAnimation = useCallback((animationConfig: RendererConfig) => {
    setCurrentConfig(animationConfig)
    loadScenario(animationConfig, { silent: true })
  }, [loadScenario])

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    updateAnimation,
  }), [updateAnimation])

  /**
   * Moveable drag handler with precise coordinate calculation
   */
  const handleDrag = useCallback((e: OnDrag) => {
    const stageW = stageSizeRef.current.width
    const stageH = stageSizeRef.current.height
    const newX = Math.max(0, Math.min(stageW - size.width, e.left))
    const newY = Math.max(0, Math.min(stageH - size.height, e.top))

    setPosition({ x: newX, y: newY })
  }, [size])

  /**
   * Moveable resize handler
   */
  const handleResize = useCallback((e: OnResize) => {
    const stageW = stageSizeRef.current.width
    const stageH = stageSizeRef.current.height
    const newWidth = Math.max(100, Math.min(stageW, e.width))
    const newHeight = Math.max(60, Math.min(stageH, e.height))

    const newLeft = Math.max(0, Math.min(stageW - newWidth, e.drag.left))
    const newTop = Math.max(0, Math.min(stageH - newHeight, e.drag.top))

    setSize({ width: newWidth, height: newHeight })
    setPosition({ x: newLeft, y: newTop })

    // DOM immediate reflection
    e.target.style.width = `${newWidth}px`
    e.target.style.height = `${newHeight}px`
  }, [])

  /**
   * Moveable rotate handler
   */
  const handleRotate = useCallback((e: OnRotate) => {
    setRotationDeg(e.rotate)
  }, [])

  /**
   * Moveable interaction start
   */
  const handleMoveableStart = useCallback(() => {
    setIsInteracting(true)
    setIsDragging(true)
    setShowSimpleText(true) // Show simple text during drag for performance
    pause() // Pause animation during interaction
  }, [pause])

  /**
   * Moveable interaction end - update scenario and sync with store
   */
  const handleMoveableEnd = useCallback(() => {
    setIsInteracting(false)
    setIsDragging(false)
    setShowSimpleText(false)

    // Convert position back to percentage for store update
    if (videoContainerRef.current) {
      const container = videoContainerRef.current
      const rect = container.getBoundingClientRect()
      const centerX = position.x + size.width / 2
      const centerY = position.y + size.height / 2
      const percentX = (centerX / rect.width) * 100
      const percentY = (centerY / rect.height) * 100

      onUpdate({
        position: {
          x: Math.max(0, Math.min(100, percentX)),
          y: Math.max(0, Math.min(100, percentY)),
        },
      })
    }

    // Update scenario after drag ends and resume animation
    void updateScenario()
    play()
  }, [position, size, videoContainerRef, onUpdate, updateScenario, play])

  /**
   * Initialize position from text data and setup responsive container observation
   */
  useEffect(() => {
    if (!videoContainerRef.current) return

    const container = videoContainerRef.current
    const rect = container.getBoundingClientRect()
    
    // Convert percentage position to pixel position
    const pixelX = (text.position.x / 100) * rect.width
    const pixelY = (text.position.y / 100) * rect.height
    
    setPosition({ x: pixelX, y: pixelY })
    stageSizeRef.current = { width: rect.width, height: rect.height }

    // Initial scaling for responsive design
    if (!hasScaledFromInitialRef.current) {
      const scaleX = rect.width / 640
      const scaleY = rect.height / 360
      setSize((s) => ({ width: s.width * scaleX, height: s.height * scaleY }))
      hasScaledFromInitialRef.current = true
    }

    // ResizeObserver for responsive handling
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      const cr = entry.contentRect
      const newW = Math.max(1, cr.width)
      const newH = Math.max(1, cr.height)

      const prev = stageSizeRef.current
      if (prev.width !== newW || prev.height !== newH) {
        const scaleX = newW / prev.width
        const scaleY = newH / prev.height

        stageSizeRef.current = { width: newW, height: newH }

        // Scale position and size proportionally
        setPosition((p) => ({ x: p.x * scaleX, y: p.y * scaleY }))
        setSize((s) => ({
          width: s.width * scaleX,
          height: s.height * scaleY,
        }))
      }
    })

    ro.observe(container)

    return () => {
      ro.disconnect()
    }
  }, [text.position, videoContainerRef])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
  }, [onSelect])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDoubleClick()
  }, [onDoubleClick])

  if (!isVisible) {
    return null
  }

  return (
    <>
      {/* Motion Text Renderer container - hidden during drag */}
      <div
        ref={motionContainerRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          visibility: isDragging ? 'hidden' : 'visible',
          transform: `translate3d(${position.x}px, ${position.y}px, 0) rotate(${rotationDeg}deg)`,
          transformOrigin: 'center center',
          width: `${size.width}px`,
          height: `${size.height}px`,
        }}
      />

      {/* Simple text during drag for performance */}
      {showSimpleText && (
        <div
          className="absolute flex items-center justify-center text-white font-sans"
          style={{
            left: 0,
            top: 0,
            width: `${size.width}px`,
            height: `${size.height}px`,
            fontSize: `${(() => {
              const avg = (size.width + size.height) / 2
              const fontSizeRel = Math.max(
                0.03,
                Math.min(0.15, (avg / stageSizeRef.current.width) * 0.15)
              )
              return fontSizeRel * stageSizeRef.current.height
            })()}px`,
            transform: `translate3d(${position.x}px, ${position.y}px, 0) rotate(${rotationDeg}deg)`,
            transformOrigin: 'center center',
            pointerEvents: 'none',
            zIndex: 10,
            willChange: 'transform',
            textAlign: 'center',
            color: text.style.color,
            fontFamily: text.style.fontFamily,
            fontWeight: text.style.fontWeight,
          }}
        >
          {text.content}
        </div>
      )}

      {/* Draggable text box (editing controls - shown when selected) */}
      {isSelected && (
        <div
          ref={textRef}
          className={`absolute border-2 border-dashed cursor-move bg-blue-500/10 backdrop-blur-sm ${
            !isInteracting && 'animate-pulse'
          }`}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${size.width}px`,
            height: `${size.height}px`,
            transform: `rotate(${rotationDeg}deg)`,
            transformOrigin: 'center center',
            borderColor: '#3b82f6',
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          {/* Position indicator during interaction */}
          {isInteracting && (
            <div className="absolute -top-6 left-0 text-xs text-blue-400 bg-gray-900/90 px-2 py-1 rounded">
              {Math.round(position.x)}, {Math.round(position.y)} •{' '}
              {Math.round(size.width)}×{Math.round(size.height)} •{' '}
              {Math.round(rotationDeg)}°
            </div>
          )}
        </div>
      )}

      {/* React Moveable component */}
      {isSelected && textRef.current && (
        <Moveable
          target={textRef.current}
          container={videoContainerRef.current}
          draggable={true}
          resizable={true}
          rotatable={true}
          throttleDrag={0}
          throttleResize={0}
          throttleRotate={0}
          origin={false}
          edge={false}
          renderDirections={['nw', 'ne', 'sw', 'se']}
          rotationPosition={'top'}
          bounds={{
            left: 0,
            top: 0,
            right: stageSizeRef.current.width,
            bottom: stageSizeRef.current.height,
          }}
          onDragStart={handleMoveableStart}
          onDrag={handleDrag}
          onDragEnd={handleMoveableEnd}
          onResizeStart={handleMoveableStart}
          onResize={handleResize}
          onResizeEnd={handleMoveableEnd}
          onRotateStart={handleMoveableStart}
          onRotate={handleRotate}
          onRotateEnd={handleMoveableEnd}
          className="moveable-control"
        />
      )}

      {/* Moveable control styles */}
      <style jsx global>{`
        .moveable-control .moveable-line {
          background: #3b82f6 !important;
        }
        .moveable-control .moveable-control {
          background: #3b82f6 !important;
          border: 2px solid #ffffff !important;
        }
        .moveable-control .moveable-rotation {
          background: #10b981 !important;
          border: 2px solid #ffffff !important;
        }
        .moveable-control .moveable-direction {
          background: #3b82f6 !important;
          border: 2px solid #ffffff !important;
        }
      `}</style>
    </>
  )
})

MovableAnimatedText.displayName = 'MovableAnimatedText'

export default MovableAnimatedText