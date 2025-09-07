'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import FontDropdown from '@/components/ui/FontDropdown'
import ToolbarButton from './shared/ToolbarButton'
import ToolbarDivider from './shared/ToolbarDivider'
import { EDITOR_COLORS } from '../../constants/colors'
import BorderStylePopup from '../ColorPicker/BorderStylePopup'
import BackgroundStylePopup from '../ColorPicker/BackgroundStylePopup'
import SimpleColorPopup from '../ColorPicker/SimpleColorPopup'

interface FormatToolbarProps {
  selectedClipIds: Set<string>
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

export default function FormatToolbar({}: FormatToolbarProps) {
  const [selectedFont, setSelectedFont] = useState('굴림 손글씨 2023')
  const [fontSize, setFontSize] = useState('100')
  const [selectedColor, setSelectedColor] = useState('#FFFF00')
  const [activeDropdown, setActiveDropdown] = useState<
    'color' | 'size' | 'saved' | null
  >(null)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [currentFormat, setCurrentFormat] = useState('클립 1')

  // Style popup states
  const [activeStylePopup, setActiveStylePopup] = useState<
    'border' | 'background' | 'highlight' | 'shadow' | null
  >(null)
  const [borderColor, setBorderColor] = useState('#FFFFFF')
  const [borderThickness, setBorderThickness] = useState(2)
  const [backgroundColor, setBackgroundColor] = useState('#000000')
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.5)
  const [highlightColor, setHighlightColor] = useState('#FFFF00')
  const [shadowColor, setShadowColor] = useState('#000000')

  const sizeButtonRef = useRef<HTMLButtonElement>(null)
  const colorButtonRef = useRef<HTMLButtonElement>(null)
  const savedFormatRef = useRef<HTMLButtonElement>(null)
  const borderButtonRef = useRef<HTMLDivElement>(null)
  const backgroundButtonRef = useRef<HTMLDivElement>(null)
  const highlightButtonRef = useRef<HTMLDivElement>(null)
  const shadowButtonRef = useRef<HTMLDivElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })

  // 외부 클릭시 드롭다운들 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null)
      setActiveStylePopup(null)
    }

    if (activeDropdown || activeStylePopup) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [activeDropdown, activeStylePopup])

  const fontOptions = [
    {
      value: '굴림 손글씨 2023',
      label: '굴림 손글씨 2023',
      category: 'handwriting' as const,
      keywords: ['굴림', '손글씨', '2023', '한국어'],
    },
    {
      value: '굴림고딕 볼드',
      label: '굴림고딕 볼드',
      category: 'gothic' as const,
      keywords: ['굴림', '고딕', '볼드', '한국어'],
    },
    {
      value: '나눔스퀘어 네오 Bold',
      label: '나눔스퀘어 네오 Bold',
      category: 'rounded' as const,
      keywords: ['나눔', '스퀘어', '네오', 'Bold', '한국어', '라운드', '둥근'],
    },
    {
      value: 'Malgun Gothic',
      label: 'Malgun Gothic',
      category: 'gothic' as const,
      keywords: ['Malgun', 'Gothic', '맑은고딕', '맑은', '고딕', '한국어'],
    },
    {
      value: 'Noto Sans KR',
      label: 'Noto Sans KR',
      category: 'gothic' as const,
      keywords: ['Noto', 'Sans', 'KR', '노토', '산스', '한국어', '고딕'],
    },
  ]

  const savedFormats = [
    { id: 'clip1', name: '클립 1' },
    { id: 'format1', name: '서식 1' },
    { id: 'format2', name: '서식 2' },
    { id: 'format3', name: '서식 3' },
  ]

  return (
    <>
      {/* 서식 지우기 */}
      <ToolbarButton
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12.318 5L20 12.682l-1.318 1.318L11 6.318 3.318 14 2 12.682 9.682 5A2 2 0 0111 4.318l1.318.682z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 20h18"
            />
          </svg>
        }
        label="서식 지우기"
      />

      {/* 저장된 서식 */}
      <ToolbarButton
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        }
        label="저장된 서식"
      />

      <ToolbarDivider />

      {/* 클립 1 표시 버튼 */}
      <div className="relative">
        <button
          ref={savedFormatRef}
          className="flex items-center space-x-2 px-3 py-1.5 bg-green-600/90 hover:bg-green-700/90 rounded-default text-white text-sm transition-colors min-w-[80px]"
          onClick={(e) => {
            e.stopPropagation()
            if (activeDropdown !== 'saved' && savedFormatRef.current) {
              const rect = savedFormatRef.current.getBoundingClientRect()
              setDropdownPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
              })
              setActiveDropdown('saved')
            } else {
              setActiveDropdown(null)
            }
          }}
        >
          <span>{currentFormat}</span>
          <svg
            className={`w-4 h-4 transition-transform ${
              activeDropdown === 'saved' ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* 저장된 서식 드롭다운 */}
        {activeDropdown === 'saved' &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              className={`fixed ${EDITOR_COLORS.dropdown.background} ${EDITOR_COLORS.dropdown.border} rounded-default shadow-lg backdrop-blur-sm min-w-[100px]`}
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                zIndex: 99999,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {savedFormats.map((format) => (
                <button
                  key={format.id}
                  className={`w-full px-3 py-1.5 text-sm text-white ${EDITOR_COLORS.dropdown.hover} text-left transition-colors ${
                    currentFormat === format.name ? 'bg-blue-500/20' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentFormat(format.name)
                    setActiveDropdown(null)
                  }}
                >
                  {format.name}
                </button>
              ))}
            </div>,
            document.body
          )}
      </div>

      {/* Bold 버튼 */}
      <button
        className={`w-8 h-8 border rounded flex items-center justify-center text-sm font-bold transition-colors ${
          isBold ? EDITOR_COLORS.button.active : EDITOR_COLORS.button.inactive
        }`}
        onClick={() => setIsBold(!isBold)}
      >
        B
      </button>

      {/* Italic 버튼 */}
      <button
        className={`w-8 h-8 border rounded flex items-center justify-center text-sm italic transition-colors ${
          isItalic ? EDITOR_COLORS.button.active : EDITOR_COLORS.button.inactive
        }`}
        onClick={() => setIsItalic(!isItalic)}
      >
        I
      </button>

      {/* 폰트 선택 드롭다운 */}
      <FontDropdown
        value={selectedFont}
        options={fontOptions}
        onChange={(font: string) => setSelectedFont(font)}
        size="small"
        className="min-w-[140px]"
        variant="toolbar"
      />

      {/* 폰트 사이즈 입력/드롭다운 */}
      <div className="relative">
        <input
          type="text"
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          className="w-16 h-8 px-2 pr-6 text-sm bg-slate-700/90 border-2 border-slate-500/70 rounded-default text-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-slate-400 hover:border-slate-400 hover:bg-slate-600/90"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          ref={sizeButtonRef}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-600/70 rounded"
          onClick={(e) => {
            e.stopPropagation()
            if (activeDropdown !== 'size') {
              const inputElement =
                e.currentTarget.parentElement?.querySelector('input')
              if (inputElement) {
                const rect = inputElement.getBoundingClientRect()
                setDropdownPosition({
                  top: rect.bottom + window.scrollY + 4,
                  left: rect.left + window.scrollX,
                })
              }
              setActiveDropdown('size')
            } else {
              setActiveDropdown(null)
            }
          }}
        >
          <svg
            className="w-3 h-3 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* 사이즈 드롭다운 메뉴 */}
        {activeDropdown === 'size' &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              className={`fixed ${EDITOR_COLORS.dropdown.background} ${EDITOR_COLORS.dropdown.border} rounded-default shadow-lg w-20 backdrop-blur-sm`}
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                zIndex: 99999,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {['50', '75', '100', '125', '150', '200', '250', '300'].map(
                (size) => (
                  <button
                    key={size}
                    className={`w-full px-3 py-1.5 text-sm text-white ${EDITOR_COLORS.dropdown.hover} text-left transition-colors`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setFontSize(size)
                      setActiveDropdown(null)
                    }}
                  >
                    {size}
                  </button>
                )
              )}
            </div>,
            document.body
          )}
      </div>

      {/* 색상 선택 버튼 */}
      <div className="relative">
        <button
          ref={colorButtonRef}
          className="w-8 h-8 border border-slate-500/70 rounded bg-slate-700/90 hover:bg-slate-600/90 transition-colors flex flex-col items-center justify-center p-1"
          onClick={(e) => {
            e.stopPropagation()
            if (activeDropdown !== 'color' && colorButtonRef.current) {
              const rect = colorButtonRef.current.getBoundingClientRect()
              setDropdownPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX,
              })
              setActiveDropdown('color')
            } else {
              setActiveDropdown(null)
            }
          }}
        >
          <span className="text-xs font-bold text-white">A</span>
          <div
            className="w-5 h-1 mt-0.5 rounded-sm"
            style={{ backgroundColor: selectedColor }}
          />
        </button>

        {/* 색상 팔레트 */}
        {activeDropdown === 'color' &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              className="fixed bg-slate-800/95 border border-slate-600 rounded-lg p-5 shadow-2xl backdrop-blur-sm"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                zIndex: 99999,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-5 gap-4 min-w-[280px]">
                {EDITOR_COLORS.textFormat.palette.map((color) => (
                  <button
                    key={color}
                    className="w-10 h-10 rounded-lg border-2 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
                    style={{
                      backgroundColor: color,
                      borderColor:
                        selectedColor === color
                          ? '#60A5FA'
                          : 'rgba(255, 255, 255, 0.2)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedColor(color)
                      setActiveDropdown(null)
                    }}
                  />
                ))}
              </div>
            </div>,
            document.body
          )}
      </div>

      <ToolbarDivider />

      {/* 테두리 버튼 */}
      <div className="relative" ref={borderButtonRef}>
        <ToolbarButton
          icon={
            <svg
              className="w-full h-full"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2" />
            </svg>
          }
          label="테두리"
          onClick={() => {
            if (activeStylePopup !== 'border' && borderButtonRef.current) {
              const rect = borderButtonRef.current.getBoundingClientRect()
              setPopupPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
              })
              setActiveStylePopup('border')
            } else {
              setActiveStylePopup(null)
            }
          }}
        />
      </div>

      {/* 배경 버튼 */}
      <div className="relative" ref={backgroundButtonRef}>
        <ToolbarButton
          icon={
            <svg
              className="w-full h-full"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          }
          label="배경"
          onClick={() => {
            if (
              activeStylePopup !== 'background' &&
              backgroundButtonRef.current
            ) {
              const rect = backgroundButtonRef.current.getBoundingClientRect()
              setPopupPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
              })
              setActiveStylePopup('background')
            } else {
              setActiveStylePopup(null)
            }
          }}
        />
      </div>

      {/* 형광펜 버튼 */}
      <div className="relative" ref={highlightButtonRef}>
        <ToolbarButton
          icon={
            <svg
              className="w-full h-full"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 10l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M7 14l-2 2m0 0l-2 2m2-2l2 2m-2-2l-2-2m12 0h.01M12 12h.01M16 16h.01M8 8h.01"
              />
            </svg>
          }
          label="형광펜"
          onClick={() => {
            if (
              activeStylePopup !== 'highlight' &&
              highlightButtonRef.current
            ) {
              const rect = highlightButtonRef.current.getBoundingClientRect()
              setPopupPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
              })
              setActiveStylePopup('highlight')
            } else {
              setActiveStylePopup(null)
            }
          }}
        />
      </div>

      <ToolbarDivider />

      {/* 그림자 버튼 */}
      <div className="relative" ref={shadowButtonRef}>
        <ToolbarButton
          icon={
            <svg
              className="w-full h-full"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <rect x="6" y="6" width="14" height="14" rx="2" strokeWidth="2" />
              <rect
                x="4"
                y="4"
                width="14"
                height="14"
                rx="2"
                fill="currentColor"
                opacity="0.3"
              />
            </svg>
          }
          label="그림자"
          onClick={() => {
            if (activeStylePopup !== 'shadow' && shadowButtonRef.current) {
              const rect = shadowButtonRef.current.getBoundingClientRect()
              setPopupPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
              })
              setActiveStylePopup('shadow')
            } else {
              setActiveStylePopup(null)
            }
          }}
        />
      </div>

      {/* 간격 버튼 */}
      <ToolbarButton
        icon={
          <svg
            className="w-full h-full"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        }
        label="간격"
      />

      <ToolbarDivider />

      {/* 고급 버튼 */}
      <ToolbarButton
        icon={
          <svg
            className="w-full h-full"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
        }
        label="고급"
      />

      {/* Style Popups */}
      {activeStylePopup === 'border' &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed z-[99999]"
            style={{
              top: popupPosition.top,
              left: popupPosition.left,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <BorderStylePopup
              color={borderColor}
              thickness={borderThickness}
              onColorChange={setBorderColor}
              onThicknessChange={setBorderThickness}
              onClose={() => setActiveStylePopup(null)}
            />
          </div>,
          document.body
        )}

      {activeStylePopup === 'background' &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed z-[99999]"
            style={{
              top: popupPosition.top,
              left: popupPosition.left,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <BackgroundStylePopup
              color={backgroundColor}
              opacity={backgroundOpacity}
              onColorChange={setBackgroundColor}
              onOpacityChange={setBackgroundOpacity}
              onClose={() => setActiveStylePopup(null)}
            />
          </div>,
          document.body
        )}

      {activeStylePopup === 'highlight' &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed z-[99999]"
            style={{
              top: popupPosition.top,
              left: popupPosition.left,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <SimpleColorPopup
              color={highlightColor}
              onColorChange={setHighlightColor}
              onClose={() => setActiveStylePopup(null)}
            />
          </div>,
          document.body
        )}

      {activeStylePopup === 'shadow' &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed z-[99999]"
            style={{
              top: popupPosition.top,
              left: popupPosition.left,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <SimpleColorPopup
              color={shadowColor}
              onColorChange={setShadowColor}
              onClose={() => setActiveStylePopup(null)}
            />
          </div>,
          document.body
        )}
    </>
  )
}
