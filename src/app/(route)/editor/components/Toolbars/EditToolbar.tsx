'use client'

import React, { useState } from 'react'
import ToolbarButton from './shared/ToolbarButton'
import ToolbarDivider from './shared/ToolbarDivider'
import ClipSelectionDropdown from './shared/ClipSelectionDropdown'
import Switch from '@/components/ui/Switch'
import { ClipItem } from '../../types'
import { showToast } from '@/utils/ui/toast'

interface EditToolbarProps {
  clips: ClipItem[]
  selectedClipIds: Set<string>
  activeClipId: string | null
  canUndo: boolean
  canRedo: boolean
  onSelectionChange: (selectedIds: Set<string>) => void
  onUndo: () => void
  onRedo: () => void
  onCut?: () => void
  onCopy?: () => void
  onPaste?: () => void
  onMergeClips: () => void
  onSplitClip?: () => void
}

/**
 * 편집 툴바 컴포넌트
 * 검은색 배경의 편집 전용 툴바
 */
export default function EditToolbar({
  clips,
  selectedClipIds,
  activeClipId,
  canUndo,
  canRedo,
  onSelectionChange,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onMergeClips,
  onSplitClip,
}: EditToolbarProps) {
  const [isVideoLocked, setIsVideoLocked] = useState(false)

  const handleVideoLockChange = (locked: boolean) => {
    setIsVideoLocked(locked)
    // TODO: Implement actual video lock functionality
    // - Disable video controls when locked
    // - Prevent video section from being resized
    // - Lock video playback controls
    showToast(
      locked ? '영상이 잠겼습니다' : '영상 잠금이 해제되었습니다',
      'success'
    )
  }

  return (
    <>
      {/* 클립 선택 드롭다운 */}
      <ClipSelectionDropdown
        clips={clips}
        selectedClipIds={selectedClipIds}
        activeClipId={activeClipId}
        onSelectionChange={onSelectionChange}
      />

      <ToolbarDivider />

      {/* 되돌리기 */}
      <ToolbarButton
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        }
        label="되돌리기"
        onClick={onUndo}
        disabled={!canUndo}
        shortcut="Ctrl+Z"
      />

      {/* 다시실행 */}
      <ToolbarButton
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6"
            />
          </svg>
        }
        label="다시실행"
        onClick={onRedo}
        disabled={!canRedo}
        shortcut="Ctrl+Y"
      />

      <ToolbarDivider />

      {/* 잘라내기 */}
      <ToolbarButton
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
            />
          </svg>
        }
        label="잘라내기"
        onClick={onCut}
        shortcut="Ctrl+X"
        disabled={selectedClipIds.size === 0}
      />

      {/* 복사하기 */}
      <ToolbarButton
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        }
        label="복사하기"
        onClick={onCopy}
        shortcut="Ctrl+C"
        disabled={selectedClipIds.size === 0}
      />

      {/* 붙여넣기 */}
      <ToolbarButton
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        }
        label="붙여넣기"
        onClick={onPaste}
        shortcut="Ctrl+V"
      />

      <ToolbarDivider />

      {/* 클립 합치기 */}
      <ToolbarButton
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        }
        label="클립 합치기"
        onClick={onMergeClips}
        shortcut="Ctrl+E"
        disabled={selectedClipIds.size < 2}
      />

      {/* 클립 나누기 */}
      <ToolbarButton
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        }
        label="클립 나누기"
        onClick={onSplitClip}
        shortcut="Enter"
        disabled={!activeClipId}
      />

      <ToolbarDivider />

      {/* 영상 잠그기 스위치 - 레이블이 아래에 위치하도록 */}
      <div className="flex flex-col items-center justify-center px-2">
        <Switch
          isSelected={isVideoLocked}
          onChange={handleVideoLockChange}
          size="small"
        />
        <span className="text-xs text-slate-400 mt-1">영상 잠그기</span>
      </div>
    </>
  )
}
