/**
 * 에디터에서 자주 사용하는 색상 정의
 * 재사용성과 일관성을 위한 중앙 색상 관리
 */

// 에디터 전용 색상 상수
export const EDITOR_COLORS = {
  // 클립 컴포넌트 색상
  clip: {
    background: '#2E2E38', // 메인 배경색 (어두운 회색)
    sidebar: '#4D4D59', // 사이드바 색상 (중간 회색)
    text: '#F2F2F2', // 메인 텍스트 (밝은 회색)
    textSecondary: '#9999A6', // 보조 텍스트 (중간 밝기 회색)
    accent: '#E6E6E6', // 강조색 (밝은 회색)
    divider: '#383842', // 구분선 (어두운 회색)
    hover: '#383842', // 호버 상태 색상

  },

  // 툴바 색상
  toolbar: {
    // 공통 툴바
    base: {
      background: 'bg-slate-800/60',
      backgroundRaw: 'rgba(30, 41, 59, 0.6)',
      border: 'border-b border-slate-600/30',
      divider: 'bg-slate-600',
      text: 'text-slate-300',
      textHover: 'text-white',
      hover: 'hover:bg-slate-700/50',
      iconColor: 'text-slate-300',
      iconHover: 'text-white',
    },
    // 편집 툴바 (검은색 배경)
    edit: {
      background: 'bg-black/90',
      backgroundRaw: 'rgba(0, 0, 0, 0.9)',
      border: 'border-b border-gray-800',
      text: 'text-gray-200',
      hover: 'hover:bg-gray-900/50',
    },
    // 기타 툴바 변형
    transparent: {
      background: 'bg-transparent',
      border: 'border-b border-gray-700/30',
    },
  },

  // 드롭다운 색상
  dropdown: {
    background: 'bg-slate-700/95',
    backgroundRaw: 'rgba(51, 65, 85, 0.95)',
    border: 'border border-slate-500/70',
    hover: 'hover:bg-slate-600/70',
    selected: 'bg-blue-500/20',
    text: 'text-white',
    textSecondary: 'text-slate-400',
    shadow: 'shadow-lg',
  },

  // 선택 상태 색상
  selection: {
    checkbox: '#33BFD9',
    focus: '#33BFD9',
    multi: '#33BFD9',
    hover: '#E6E6E6',
    ring: 'ring-2 ring-[#33BFD9]',
    ringFocus: 'ring-4 ring-[#33BFD9]',
  },

  // 버튼 상태 색상
  button: {
    primary: 'bg-blue-500 hover:bg-blue-600',
    secondary: 'bg-slate-600 hover:bg-slate-700',
    accent: 'bg-[#33BFD9] hover:bg-[#2BA5C3]',
    active: 'bg-blue-500 border-blue-500 text-white',
    inactive: 'border-slate-600 text-slate-300 hover:bg-slate-700/50',
    disabled: 'bg-slate-500 text-slate-400 cursor-not-allowed',
    hover: 'hover:bg-slate-700/50',
  },

  // 텍스트 서식 색상 팔레트
  textFormat: {
    palette: [
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
    ],
  },

  // 배경 색상
  background: {
    editor: 'bg-gray-900',
    panel: 'bg-slate-800/80',
    modal: 'bg-black/50',
    overlay: 'bg-black/70',
  },
} as const

// 색상 타입 정의
export type EditorColorKey = keyof typeof EDITOR_COLORS
export type ToolbarVariant = keyof typeof EDITOR_COLORS.toolbar

// Tailwind 클래스 조합 헬퍼 함수들
export const getToolbarClasses = (variant: ToolbarVariant = 'base') => {
  const colors = EDITOR_COLORS.toolbar[variant]
  return `${colors.background} backdrop-blur-sm ${colors.border}`
}

export const getButtonClasses = (
  state: 'primary' | 'secondary' | 'accent' | 'disabled'
) => {
  return EDITOR_COLORS.button[state]
}

export const getDropdownClasses = () => {
  const dropdown = EDITOR_COLORS.dropdown
  return `${dropdown.background} ${dropdown.border} ${dropdown.shadow} backdrop-blur-sm`
}

// 색상 유틸리티 함수
export const getClipColorStyle = (
  property: 'background' | 'text' | 'border'
) => {
  switch (property) {
    case 'background':
      return { backgroundColor: EDITOR_COLORS.clip.background }
    case 'text':
      return { color: EDITOR_COLORS.clip.text }
    case 'border':
      return { borderColor: EDITOR_COLORS.clip.divider }
    default:
      return {}
  }
}

// 동적 색상 생성 함수 (투명도 조절)
export const withOpacity = (hexColor: string, opacity: number): string => {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// 색상 대비 확인 함수 (접근성)
export const hasGoodContrast = (bg: string, text: string): boolean => {
  // 간단한 대비 체크 (실제로는 WCAG 기준 사용 권장)
  const isDarkBg =
    bg.includes('black') || bg.includes('slate-8') || bg.includes('gray-9')
  const isLightText =
    text.includes('white') ||
    text.includes('slate-3') ||
    text.includes('gray-2')
  return isDarkBg !== isLightText
}
