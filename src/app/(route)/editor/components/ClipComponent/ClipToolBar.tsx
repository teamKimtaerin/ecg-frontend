'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import FontDropdown from '@/components/ui/FontDropdown'
import Tooltip from '@/components/ui/Tooltip'
import { ClipToolBarProps } from './types'

// 기본 서식 그룹 컴포넌트
function TextFormattingGroup() {
  const [selectedFont, setSelectedFont] = useState('굴림고딕 볼드')
  const [fontSize, setFontSize] = useState('100')
  const [selectedColor, setSelectedColor] = useState('#FFFFFF')
  const [activeDropdown, setActiveDropdown] = useState<'color' | 'size' | null>(
    null
  )
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)

  const sizeButtonRef = useRef<HTMLButtonElement>(null)
  const colorButtonRef = useRef<HTMLButtonElement>(null)
  const [sizeDropdownPosition, setSizeDropdownPosition] = useState({
    top: 0,
    left: 0,
  })
  const [colorDropdownPosition, setColorDropdownPosition] = useState({
    top: 0,
    left: 0,
  })

  // 외부 클릭시 드롭다운들 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null)
    }

    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [activeDropdown])

  const fontOptions = [
    {
      value: '굴림고딕 볼드',
      label: '굴림고딕 볼드',
      category: 'gothic' as const,
      keywords: ['굴림', '고딕', '볼드', '한국어'],
    },
    {
      value: '고도 손글씨 2019',
      label: '고도 손글씨 2019',
      category: 'handwriting' as const,
      keywords: ['고도', '손글씨', '2019', '한국어', '필기체'],
    },
    {
      value: '고도 손글씨 2020',
      label: '고도 손글씨 2020',
      category: 'handwriting' as const,
      keywords: ['고도', '손글씨', '2020', '한국어', '필기체'],
    },
    {
      value: '고도 손글씨 2021',
      label: '고도 손글씨 2021',
      category: 'handwriting' as const,
      keywords: ['고도', '손글씨', '2021', '한국어', '필기체'],
    },
    {
      value: '고도 손글씨 2022',
      label: '고도 손글씨 2022',
      category: 'handwriting' as const,
      keywords: ['고도', '손글씨', '2022', '한국어', '필기체'],
    },
    {
      value: '교보 손글씨 2023',
      label: '교보 손글씨 2023',
      category: 'handwriting' as const,
      keywords: ['교보', '손글씨', '2023', '한국어', '필기체', '교', '보'],
    },
    {
      value: '고도 손글씨 2024',
      label: '고도 손글씨 2024',
      category: 'handwriting' as const,
      keywords: ['고도', '손글씨', '2024', '한국어', '필기체'],
    },
    {
      value: '나눔스퀘어 네오 Bold',
      label: '나눔스퀘어 네오 Bold',
      category: 'rounded' as const,
      keywords: ['나눔', '스퀘어', '네오', 'Bold', '한국어', '라운드', '둥근'],
    },
    {
      value: '나눔스퀘어 네오 ExtraBold',
      label: '나눔스퀘어 네오 ExtraBold',
      category: 'rounded' as const,
      keywords: [
        '나눔',
        '스퀘어',
        '네오',
        'ExtraBold',
        '한국어',
        '라운드',
        '둥근',
      ],
    },
    {
      value: '나눔스퀘어 네오 Heavy',
      label: '나눔스퀘어 네오 Heavy',
      category: 'rounded' as const,
      keywords: ['나눔', '스퀘어', '네오', 'Heavy', '한국어', '라운드', '둥근'],
    },
    {
      value: 'Arial',
      label: 'Arial',
      category: 'gothic' as const,
      keywords: ['Arial', 'Sans-serif', '영어', '고딕'],
    },
    {
      value: 'Times New Roman',
      label: 'Times New Roman',
      category: 'serif' as const,
      keywords: ['Times', 'New', 'Roman', 'Serif', '영어', '명조', '세리프'],
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

  const colorPalette = [
    '#FFFFFF',
    '#000000',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#FFA500',
    '#800080',
    '#FFC0CB',
    '#A52A2A',
    '#808080',
    '#90EE90',
    '#FFB6C1',
    '#8B4513',
    '#2E8B57',
    '#4682B4',
    '#D2691E',
    '#9ACD32',
  ]

  return (
    <div className="flex items-center space-x-2">
      {/* 폰트 선택 드롭다운 */}
      <FontDropdown
        value={selectedFont}
        options={fontOptions}
        onChange={(font: string) => setSelectedFont(font)}
        size="small"
        className="min-w-[120px]"
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
                setSizeDropdownPosition({
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

        {/* 사이즈 드롭다운 메뉴 - Portal로 렌더링 */}
        {activeDropdown === 'size' &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              className="fixed bg-slate-700/95 border border-slate-500/70 rounded-default shadow-lg w-20 backdrop-blur-sm"
              style={{
                top: sizeDropdownPosition.top,
                left: sizeDropdownPosition.left,
                zIndex: 99999,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {['50', '75', '100', '125', '150', '200', '250', '300'].map(
                (size) => (
                  <button
                    key={size}
                    className="w-full px-3 py-1.5 text-sm text-white hover:bg-slate-600/70 text-left transition-colors"
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
              setColorDropdownPosition({
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

        {/* 색상 팔레트 - Portal로 렌더링 */}
        {activeDropdown === 'color' &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              className="fixed bg-slate-800/95 border border-slate-600 rounded-lg p-5 shadow-2xl backdrop-blur-sm"
              style={{
                top: colorDropdownPosition.top,
                left: colorDropdownPosition.left,
                zIndex: 99999,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-5 gap-4 min-w-[280px]">
                {colorPalette.map((color) => (
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

      {/* Bold 버튼 */}
      <button
        className={`w-8 h-8 border rounded flex items-center justify-center text-sm font-bold transition-colors ${
          isBold
            ? 'bg-blue-500 border-blue-500 text-white'
            : 'border-slate-600 text-slate-300 hover:bg-slate-700/50'
        }`}
        onClick={() => setIsBold(!isBold)}
      >
        B
      </button>

      {/* Italic 버튼 */}
      <button
        className={`w-8 h-8 border rounded flex items-center justify-center text-sm italic transition-colors ${
          isItalic
            ? 'bg-blue-500 border-blue-500 text-white'
            : 'border-slate-600 text-slate-300 hover:bg-slate-700/50'
        }`}
        onClick={() => setIsItalic(!isItalic)}
      >
        I
      </button>
    </div>
  )
}

export default function ClipToolBar({
  canUndo,
  canRedo,
  onNewClick,
  onMergeClips,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onSplitClip,
}: ClipToolBarProps) {
  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border-b border-slate-600/30 px-6 py-4">
      <div className="flex items-center space-x-3">
        {/* 새로 만들기 */}
        <Tooltip content="새로 만들기" shortcut="Ctrl+N">
          <div
            className="flex flex-col items-center space-y-1 px-2 py-1 hover:bg-slate-700/50 rounded cursor-pointer"
            onClick={onNewClick}
          >
            <svg
              className="w-5 h-5 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-xs text-slate-300">새로 만들기</span>
          </div>
        </Tooltip>

        {/* 프로젝트 열기 */}
        <Tooltip content="프로젝트 열기" shortcut="Ctrl+O">
          <div className="flex flex-col items-center space-y-1 px-2 py-1 hover:bg-slate-700/50 rounded cursor-pointer">
            <svg
              className="w-5 h-5 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-xs text-slate-300">프로젝트 열기</span>
          </div>
        </Tooltip>

        <div className="w-px h-12 bg-slate-600 mx-2" />

        {/* 되돌리기 */}
        <Tooltip content="되돌리기" shortcut="Ctrl+Z" disabled={!canUndo}>
          <div
            className={`flex flex-col items-center space-y-1 px-2 py-1 rounded cursor-pointer transition-colors ${
              canUndo
                ? 'hover:bg-slate-700/50 text-slate-300'
                : 'text-slate-500 cursor-not-allowed'
            }`}
            onClick={canUndo ? onUndo : undefined}
          >
            <svg
              className={`w-5 h-5 ${canUndo ? 'text-slate-300' : 'text-slate-500'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            <span
              className={`text-xs ${canUndo ? 'text-slate-300' : 'text-slate-500'}`}
            >
              되돌리기
            </span>
          </div>
        </Tooltip>

        {/* 다시실행 */}
        <Tooltip content="다시실행" shortcut="Ctrl+Y" disabled={!canRedo}>
          <div
            className={`flex flex-col items-center space-y-1 px-2 py-1 rounded cursor-pointer transition-colors ${
              canRedo
                ? 'hover:bg-slate-700/50 text-slate-300'
                : 'text-slate-500 cursor-not-allowed'
            }`}
            onClick={canRedo ? onRedo : undefined}
          >
            <svg
              className={`w-5 h-5 ${canRedo ? 'text-slate-300' : 'text-slate-500'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6"
              />
            </svg>
            <span
              className={`text-xs ${canRedo ? 'text-slate-300' : 'text-slate-500'}`}
            >
              다시실행
            </span>
          </div>
        </Tooltip>

        <div className="w-px h-12 bg-slate-600 mx-2" />

        {/* 잘라내기 */}
        <Tooltip content="잘라내기" shortcut="Ctrl+X">
          <div
            className="flex flex-col items-center space-y-1 px-2 py-1 hover:bg-slate-700/50 rounded cursor-pointer"
            onClick={onCut}
          >
            <svg
              className="w-5 h-5 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM6 6v12h12V6H6zm2 3h8v2H8V9zm0 4h8v2H8v-2z"
              />
            </svg>
            <span className="text-xs text-slate-300">잘라내기</span>
          </div>
        </Tooltip>

        {/* 복사하기 */}
        <Tooltip content="복사하기" shortcut="Ctrl+C">
          <div
            className="flex flex-col items-center space-y-1 px-2 py-1 hover:bg-slate-700/50 rounded cursor-pointer"
            onClick={onCopy}
          >
            <svg
              className="w-5 h-5 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2V9.5S16 9 15.5 9H13a2 2 0 01-2-2V5.5S11 5 10.5 5H8a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v0"
              />
            </svg>
            <span className="text-xs text-slate-300">복사하기</span>
          </div>
        </Tooltip>

        {/* 붙여넣기 */}
        <Tooltip content="붙여넣기" shortcut="Ctrl+V">
          <div
            className="flex flex-col items-center space-y-1 px-2 py-1 hover:bg-slate-700/50 rounded cursor-pointer"
            onClick={onPaste}
          >
            <svg
              className="w-5 h-5 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-xs text-slate-300">붙여넣기</span>
          </div>
        </Tooltip>

        <div className="w-px h-12 bg-slate-600 mx-2" />

        {/* 클립 합치기 */}
        <Tooltip content="클립 합치기" shortcut="Ctrl+E">
          <div
            className="flex flex-col items-center space-y-1 px-2 py-1 hover:bg-slate-700/50 rounded cursor-pointer"
            onClick={onMergeClips}
          >
            <svg
              className="w-5 h-5 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span className="text-xs text-slate-300">클립 합치기</span>
          </div>
        </Tooltip>

        {/* 클립 나누기 */}
        <Tooltip content="클립 나누기" shortcut="Enter">
          <div
            className="flex flex-col items-center space-y-1 px-2 py-1 hover:bg-slate-700/50 rounded cursor-pointer"
            onClick={onSplitClip}
          >
            <svg
              className="w-5 h-5 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <rect
                x="3"
                y="6"
                width="18"
                height="12"
                rx="2"
                ry="2"
                strokeWidth="2"
              />
              <line x1="12" y1="6" x2="12" y2="18" strokeWidth="2" />
            </svg>
            <span className="text-xs text-slate-300">클립 나누기</span>
          </div>
        </Tooltip>

        <div className="w-px h-12 bg-slate-600 mx-2" />

        {/* 기본 서식 그룹 */}
        <div className="flex items-center space-x-2 px-3 py-2 bg-slate-700/30 rounded-lg">
          <span className="text-xs text-slate-400 mr-2">기본 서식</span>
          <TextFormattingGroup />
        </div>
      </div>
    </div>
  )
}
