'use client'

import React from 'react'
import { EditorTab, ClipItem } from '../../types'
import HomeToolbar from './HomeToolbar'
import EditToolbar from './EditToolbar'
import FormatToolbar from './FormatToolbar'

import ToolbarWrapper from './shared/ToolbarWrapper'

interface ToolbarsProps {
  activeTab: EditorTab
  clips: ClipItem[]
  selectedClipIds: Set<string>
  activeClipId: string | null
  canUndo: boolean
  canRedo: boolean
  onSelectionChange: (selectedIds: Set<string>) => void
  onNewClick: () => void
  onMergeClips: () => void
  onUndo: () => void
  onRedo: () => void
  onCut?: () => void
  onCopy?: () => void
  onPaste?: () => void
  onSplitClip?: () => void
  onRestore?: () => void
}

/**
 * 툴바 라우터 컴포넌트
 * activeTab에 따라 적절한 툴바를 렌더링
 */
export default function Toolbars({
  activeTab,
  clips,
  selectedClipIds,
  activeClipId,
  canUndo,
  canRedo,
  onSelectionChange,
  onNewClick,
  onMergeClips,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onSplitClip,
  onRestore,
}: ToolbarsProps) {
  // 공통 props
  const commonProps = {
    selectedClipIds,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onCut,
    onCopy,
    onPaste,
    onMergeClips,
    onSplitClip,
  }

  // Export 버튼 핸들러
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export project')
  }

  // 탭에 따른 툴바 렌더링
  switch (activeTab) {
    case 'home':
      return (
        <ToolbarWrapper variant="base" onExport={handleExport}>
          <HomeToolbar {...commonProps} onNewClick={onNewClick} />
        </ToolbarWrapper>
      )

    case 'edit':
      return (
        <ToolbarWrapper variant="edit" onExport={handleExport}>
          <EditToolbar
            {...commonProps}
            clips={clips}
            activeClipId={activeClipId}
            onSelectionChange={onSelectionChange}
            onRestore={onRestore}
          />
        </ToolbarWrapper>
      )

    case 'subtitle':
      // TODO: SubtitleToolbar 구현
      return (
        <ToolbarWrapper variant="base" onExport={handleExport}>
          <HomeToolbar {...commonProps} onNewClick={onNewClick} />
        </ToolbarWrapper>
      )

    case 'format':
      return (
        <ToolbarWrapper variant="base" onExport={handleExport}>
          <FormatToolbar {...commonProps} />
        </ToolbarWrapper>
      )

    case 'insert':
      // TODO: InsertToolbar 구현
      return (
        <ToolbarWrapper variant="base" onExport={handleExport}>
          <HomeToolbar {...commonProps} onNewClick={onNewClick} />
        </ToolbarWrapper>
      )

    case 'template':
      // TODO: TemplateToolbar 구현
      return (
        <ToolbarWrapper variant="base" onExport={handleExport}>
          <HomeToolbar {...commonProps} onNewClick={onNewClick} />
        </ToolbarWrapper>
      )

    case 'effect':
      // TODO: EffectToolbar 구현
      return (
        <ToolbarWrapper variant="base" onExport={handleExport}>
          <HomeToolbar {...commonProps} onNewClick={onNewClick} />
        </ToolbarWrapper>
      )

    default:
      return (
        <ToolbarWrapper variant="base" onExport={handleExport}>
          <HomeToolbar {...commonProps} onNewClick={onNewClick} />
        </ToolbarWrapper>
      )
  }
}

// 기존 ClipToolBar 호환성을 위한 export
export { HomeToolbar as ClipToolBar }
