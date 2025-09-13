'use client'

import React, { useState, useEffect } from 'react'
import { useEditorStore } from '../../store'
import type { TextStyle, TextAnimation } from '../../types/textInsertion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import ColorPicker from '@/components/ui/ColorPicker'
import Slider from '@/components/ui/Slider'

interface TextEditingPanelProps {
  isOpen: boolean
  onToggle: () => void
}

const FONT_FAMILIES = [
  'Arial, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Helvetica, sans-serif',
  'Verdana, sans-serif',
  'Courier New, monospace',
  'Impact, sans-serif',
  'Comic Sans MS, cursive',
]

const ANIMATION_PLUGINS = [
  { plugin: 'fadein@1.0.0', label: '페이드 인' },
  { plugin: 'elastic@1.0.0', label: '탄성 바운스' },
  { plugin: 'slideup@1.0.0', label: '슬라이드 업' },
  { plugin: 'typewriter@1.0.0', label: '타이프라이터' },
  { plugin: 'glitch@1.0.0', label: '글리치' },
  { plugin: 'glow@1.0.0', label: '글로우' },
  { plugin: 'rotation@1.0.0', label: '회전' },
  { plugin: 'scalepop@1.0.0', label: '스케일 팝' },
  { plugin: 'pulse@1.0.0', label: '펄스' },
  { plugin: 'flames@1.0.0', label: '화염' },
  { plugin: 'magnetic@1.0.0', label: '자석' },
]

export default function TextEditingPanel({ isOpen, onToggle }: TextEditingPanelProps) {
  const { insertedTexts, selectedTextId, updateText, defaultStyle } = useEditorStore()
  
  // Get selected text
  const selectedText = selectedTextId ? insertedTexts.find(t => t.id === selectedTextId) : null

  // Local state for editing
  const [localStyle, setLocalStyle] = useState<TextStyle>(defaultStyle)
  const [localAnimation, setLocalAnimation] = useState<TextAnimation>({
    plugin: 'fadein@1.0.0',
    parameters: {
      duration: 1000,
      easing: 'power2.out',
    },
  })
  const [localContent, setLocalContent] = useState('')
  const [localStartTime, setLocalStartTime] = useState(0)
  const [localEndTime, setLocalEndTime] = useState(3)

  // Update local state when selected text changes
  useEffect(() => {
    if (selectedText) {
      setLocalStyle(selectedText.style)
      setLocalAnimation(selectedText.animation || {
        plugin: 'fadein@1.0.0',
        parameters: {
          duration: 1000,
          easing: 'power2.out',
        },
      })
      setLocalContent(selectedText.content)
      setLocalStartTime(selectedText.startTime)
      setLocalEndTime(selectedText.endTime)
    } else {
      setLocalStyle(defaultStyle)
      setLocalAnimation({
        plugin: 'fadein@1.0.0',
        parameters: {
          duration: 1000,
          easing: 'power2.out',
        },
      })
      setLocalContent('')
      setLocalStartTime(0)
      setLocalEndTime(3)
    }
  }, [selectedText, defaultStyle])

  // Apply changes to selected text (unused but kept for future use)
  // const applyChanges = () => {
  //   if (selectedText) {
  //     updateText(selectedText.id, {
  //       content: localContent,
  //       startTime: localStartTime,
  //       endTime: localEndTime,
  //       style: localStyle,
  //       animation: localAnimation,
  //     })
  //   }
  // }

  // Handle style changes
  const handleStyleChange = (key: keyof TextStyle, value: string | number) => {
    const newStyle = { ...localStyle, [key]: value }
    setLocalStyle(newStyle)
    
    // Auto-apply changes
    if (selectedText) {
      updateText(selectedText.id, { style: newStyle })
    }
  }

  // Handle animation plugin change
  const handleAnimationPluginChange = (plugin: string) => {
    const newAnimation: TextAnimation = {
      plugin,
      parameters: getDefaultParametersForPlugin(plugin),
    }
    setLocalAnimation(newAnimation)
    
    // Auto-apply changes
    if (selectedText) {
      updateText(selectedText.id, { animation: newAnimation })
    }
  }

  // Handle animation parameter changes
  const handleAnimationParameterChange = (key: string, value: unknown) => {
    const newAnimation = {
      ...localAnimation,
      parameters: {
        ...localAnimation.parameters,
        [key]: value,
      },
    }
    setLocalAnimation(newAnimation)
    
    // Auto-apply changes
    if (selectedText) {
      updateText(selectedText.id, { animation: newAnimation })
    }
  }

  // Get default parameters for a plugin
  const getDefaultParametersForPlugin = (plugin: string): Record<string, unknown> => {
    switch (plugin) {
      case 'fadein@1.0.0':
        return {
          staggerDelay: 0.1,
          animationDuration: 0.8,
          startOpacity: 0,
          scaleStart: 0.9,
          ease: 'power2.out',
        }
      case 'elastic@1.0.0':
        return {
          bounceStrength: 0.7,
          animationDuration: 1.5,
          staggerDelay: 0.1,
          startScale: 0,
          overshoot: 1.3,
        }
      case 'slideup@1.0.0':
        return {
          distance: 50,
          duration: 1.0,
          staggerDelay: 0.05,
          ease: 'power2.out',
        }
      case 'typewriter@1.0.0':
        return {
          charDelay: 0.05,
          cursorBlink: true,
          cursorDuration: 0.5,
        }
      default:
        return {
          duration: 1000,
          easing: 'power2.out',
        }
    }
  }

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newContent = e.target.value
    setLocalContent(newContent)
    
    // Auto-apply changes
    if (selectedText) {
      updateText(selectedText.id, { content: newContent })
    }
  }

  // Handle timing changes
  const handleStartTimeChange = (value: string) => {
    const startTime = parseFloat(value) || 0
    setLocalStartTime(startTime)
    const endTime = Math.max(startTime + 0.1, localEndTime)
    setLocalEndTime(endTime)
    
    // Auto-apply changes
    if (selectedText) {
      updateText(selectedText.id, { 
        startTime, 
        endTime 
      })
    }
  }

  const handleEndTimeChange = (value: string) => {
    const endTime = parseFloat(value) || 0.1
    const finalEndTime = Math.max(localStartTime + 0.1, endTime)
    setLocalEndTime(finalEndTime)
    
    // Auto-apply changes
    if (selectedText) {
      updateText(selectedText.id, { endTime: finalEndTime })
    }
  }

  if (!isOpen) {
    return (
      <div className="bg-white border-t border-gray-200 p-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
          <span className="text-sm font-medium">텍스트 편집 패널</span>
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border-t border-gray-200 max-h-64 overflow-y-auto">
      {/* Panel Header */}
      <div className="border-b border-gray-200 p-3">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between text-gray-800"
        >
          <span className="font-medium">
            {selectedText ? `텍스트 편집: "${selectedText.content.slice(0, 20)}${selectedText.content.length > 20 ? '...' : ''}"` : '텍스트 편집 패널'}
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {selectedText ? (
        <div className="p-4 space-y-4">
          {/* Text Content */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              텍스트 내용
            </label>
            <input
              value={localContent}
              onChange={handleContentChange}
              className="w-full p-2 text-sm border border-gray-300 rounded text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="텍스트를 입력하세요..."
            />
          </div>

          {/* Timing Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                시작 시간 (초)
              </label>
              <input
                type="number"
                value={localStartTime.toString()}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                min="0"
                step="0.1"
                className="w-full p-2 text-sm border border-gray-300 rounded text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                종료 시간 (초)
              </label>
              <input
                type="number"
                value={localEndTime.toString()}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                min={localStartTime + 0.1}
                step="0.1"
                className="w-full p-2 text-sm border border-gray-300 rounded text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Style Controls */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">스타일</h4>
            
            {/* Font and Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  폰트
                </label>
                <select
                  value={localStyle.fontFamily}
                  onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {FONT_FAMILIES.map((font) => (
                    <option key={font} value={font}>
                      {font.split(',')[0]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  크기: {localStyle.fontSize}px
                </label>
                <Slider
                  value={localStyle.fontSize}
                  onChange={(value) => handleStyleChange('fontSize', value)}
                  minValue={12}
                  maxValue={72}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  글자 색상
                </label>
                <ColorPicker
                  value={localStyle.color}
                  onChange={(color) => handleStyleChange('color', color)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  배경 색상
                </label>
                <ColorPicker
                  value={localStyle.backgroundColor || '#000000'}
                  onChange={(color) => handleStyleChange('backgroundColor', color)}
                />
              </div>
            </div>

            {/* Font Style Options */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  굵기
                </label>
                <select
                  value={localStyle.fontWeight}
                  onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="normal">보통</option>
                  <option value="bold">굵게</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  스타일
                </label>
                <select
                  value={localStyle.fontStyle}
                  onChange={(e) => handleStyleChange('fontStyle', e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="normal">보통</option>
                  <option value="italic">기울임</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  정렬
                </label>
                <select
                  value={localStyle.textAlign}
                  onChange={(e) => handleStyleChange('textAlign', e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="left">왼쪽</option>
                  <option value="center">가운데</option>
                  <option value="right">오른쪽</option>
                </select>
              </div>
            </div>
          </div>

          {/* Animation Controls */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">애니메이션</h4>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                플러그인
              </label>
              <select
                value={localAnimation.plugin}
                onChange={(e) => handleAnimationPluginChange(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {ANIMATION_PLUGINS.map((anim) => (
                  <option key={anim.plugin} value={anim.plugin}>
                    {anim.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Animation Parameters */}
            {localAnimation.plugin === 'fadein@1.0.0' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    순차 간격: {(localAnimation.parameters.staggerDelay as number)?.toFixed(2)}초
                  </label>
                  <Slider
                    value={localAnimation.parameters.staggerDelay as number}
                    onChange={(value) => handleAnimationParameterChange('staggerDelay', value)}
                    minValue={0.02}
                    maxValue={0.5}
                    step={0.01}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    페이드 속도: {(localAnimation.parameters.animationDuration as number)?.toFixed(1)}초
                  </label>
                  <Slider
                    value={localAnimation.parameters.animationDuration as number}
                    onChange={(value) => handleAnimationParameterChange('animationDuration', value)}
                    minValue={0.2}
                    maxValue={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {localAnimation.plugin === 'elastic@1.0.0' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    바운스 강도: {(localAnimation.parameters.bounceStrength as number)?.toFixed(1)}
                  </label>
                  <Slider
                    value={localAnimation.parameters.bounceStrength as number}
                    onChange={(value) => handleAnimationParameterChange('bounceStrength', value)}
                    minValue={0.1}
                    maxValue={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    애니메이션 속도: {(localAnimation.parameters.animationDuration as number)?.toFixed(1)}초
                  </label>
                  <Slider
                    value={localAnimation.parameters.animationDuration as number}
                    onChange={(value) => handleAnimationParameterChange('animationDuration', value)}
                    minValue={0.5}
                    maxValue={4}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {localAnimation.plugin === 'typewriter@1.0.0' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    글자 간격: {(localAnimation.parameters.charDelay as number)?.toFixed(3)}초
                  </label>
                  <Slider
                    value={localAnimation.parameters.charDelay as number}
                    onChange={(value) => handleAnimationParameterChange('charDelay', value)}
                    minValue={0.01}
                    maxValue={0.2}
                    step={0.005}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localAnimation.parameters.cursorBlink as boolean}
                    onChange={(e) => handleAnimationParameterChange('cursorBlink', e.target.checked)}
                    className="mr-2"
                  />
                  <label className="text-xs font-medium text-gray-700">
                    커서 깜빡임
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">
          <p className="text-sm">텍스트를 선택하여 편집하세요</p>
        </div>
      )}
    </div>
  )
}