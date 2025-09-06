'use client'

import React from 'react'
import Dropdown from '@/components/Dropdown'

interface ToolbarProps {
  activeTab: string
}

// 기본 서식 그룹 컴포넌트
function TextFormattingGroup() {
  const [selectedFont, setSelectedFont] = React.useState('굴림고딕 볼드')
  const [fontSize, setFontSize] = React.useState('100')
  const [selectedColor, setSelectedColor] = React.useState('#FFFFFF')
  const [showColorPalette, setShowColorPalette] = React.useState(false)
  const [showSizeDropdown, setShowSizeDropdown] = React.useState(false)
  const [isBold, setIsBold] = React.useState(false)
  const [isItalic, setIsItalic] = React.useState(false)

  // 외부 클릭시 드롭다운들 닫기
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowColorPalette(false)
      setShowSizeDropdown(false)
    }

    if (showColorPalette || showSizeDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showColorPalette, showSizeDropdown])

  const fontOptions = [
    { value: '굴림고딕 볼드', label: '굴림고딕 볼드' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Malgun Gothic', label: 'Malgun Gothic' },
    { value: 'Noto Sans KR', label: 'Noto Sans KR' },
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
      <Dropdown
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
          className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-600/70 rounded"
          onClick={(e) => {
            e.stopPropagation()
            setShowSizeDropdown(!showSizeDropdown)
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
        {showSizeDropdown && (
          <div
            className="absolute top-full mt-1 left-0 bg-slate-700/95 border border-slate-500/70 rounded-default shadow-lg z-50 w-20 backdrop-blur-sm"
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
                    setShowSizeDropdown(false)
                  }}
                >
                  {size}
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* 색상 선택 버튼 */}
      <div className="relative">
        <button
          className="w-8 h-8 border border-slate-500/70 rounded bg-slate-700/90 hover:bg-slate-600/90 transition-colors flex flex-col items-center justify-center p-1"
          onClick={(e) => {
            e.stopPropagation()
            setShowColorPalette(!showColorPalette)
          }}
        >
          <span className="text-xs font-bold text-white">A</span>
          <div
            className="w-5 h-1 mt-0.5 rounded-sm"
            style={{ backgroundColor: selectedColor }}
          />
        </button>

        {/* 색상 팔레트 */}
        {showColorPalette && (
          <div
            className="absolute top-full mt-2 left-0 bg-slate-800/95 border border-slate-600 rounded-lg p-5 shadow-2xl z-50 backdrop-blur-sm"
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
                    setShowColorPalette(false)
                  }}
                />
              ))}
            </div>
          </div>
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

const Toolbar: React.FC<ToolbarProps> = ({ activeTab }) => {
  const renderHomeTools = () => (
    <div className="flex items-center space-x-3">
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span className="text-xs text-slate-300">새로 만들기</span>
      </div>
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
      <div className="w-px h-12 bg-slate-600 mx-2" />
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
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
          />
        </svg>
        <span className="text-xs text-slate-300">되돌리기</span>
      </div>
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
            d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6"
          />
        </svg>
        <span className="text-xs text-slate-300">다시실행</span>
      </div>
      <div className="w-px h-12 bg-slate-600 mx-2" />
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
            d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM6 6v12h12V6H6zm2 3h8v2H8V9zm0 4h8v2H8v-2z"
          />
        </svg>
        <span className="text-xs text-slate-300">잘라내기</span>
      </div>
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
            d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2V9.5S16 9 15.5 9H13a2 2 0 01-2-2V5.5S11 5 10.5 5H8a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v0"
          />
        </svg>
        <span className="text-xs text-slate-300">복사하기</span>
      </div>
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
        <span className="text-xs text-slate-300">붙여넣기</span>
      </div>
      <div className="w-px h-12 bg-slate-600 mx-2" />
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
            d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
          />
        </svg>
        <span className="text-xs text-slate-300">클립 합치기</span>
      </div>
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
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-10V3a1 1 0 011-1h4a1 1 0 011 1v1M7 7h10a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z"
          />
        </svg>
        <span className="text-xs text-slate-300">클립 나누기</span>
      </div>
      <div className="w-px h-12 bg-slate-600 mx-2" />

      {/* 기본 서식 그룹 */}
      <div className="flex items-center space-x-2 px-3 py-2 bg-slate-700/30 rounded-lg">
        <span className="text-xs text-slate-400 mr-2">기본 서식</span>
        <TextFormattingGroup />
      </div>
    </div>
  )

  const renderToolsForTab = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeTools()
      case 'file':
        return (
          <div className="flex items-center space-x-3">
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <span className="text-xs text-slate-300">파일 열기</span>
            </div>
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
                  d="M8 7H5a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h8m0 0h2a2 2 0 002-2V9a2 2 0 00-2-2h-2m0 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m8 0V9a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h6V7z"
                />
              </svg>
              <span className="text-xs text-slate-300">저장</span>
            </div>
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
              <span className="text-xs text-slate-300">다른 이름으로</span>
            </div>
          </div>
        )
      case 'edit':
        return (
          <div className="flex items-center space-x-3">
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
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-10V3a1 1 0 011-1h4a1 1 0 011 1v1M7 7h10a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z"
                />
              </svg>
              <span className="text-xs text-slate-300">분할</span>
            </div>
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
                  d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                />
              </svg>
              <span className="text-xs text-slate-300">병합</span>
            </div>
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span className="text-xs text-slate-300">삭제</span>
            </div>
          </div>
        )
      case 'subtitle':
        return (
          <div className="flex items-center space-x-3">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="text-xs text-slate-300">자막 추가</span>
            </div>
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span className="text-xs text-slate-300">자막 삭제</span>
            </div>
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs text-slate-300">타이밍 조정</span>
            </div>
          </div>
        )
      default:
        return <div className="text-xs text-slate-400">도구 없음</div>
    }
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border-b border-slate-600/30 px-6 py-4">
      {renderToolsForTab()}
    </div>
  )
}

export default Toolbar
