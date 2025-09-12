'use client'

import React, { useState } from 'react'
import ToolbarButton from './Toolbars/shared/ToolbarButton'
import ToolbarDivider from './Toolbars/shared/ToolbarDivider'
import ToolbarBase from './Toolbars/shared/ToolbarBase'
import {
  AiOutlineExport,
  AiOutlineSave,
  AiOutlineFolderAdd,
} from 'react-icons/ai'
import ExportModal from './Export/ExportModal'
import { ExportFormat } from './Export/ExportTypes'

interface SimpleToolbarProps {
  activeClipId: string | null
  canUndo: boolean
  canRedo: boolean
  onNewClick: () => void
  onMergeClips: () => void
  onUndo: () => void
  onRedo: () => void
  onSplitClip: () => void
  onToggleTemplateSidebar: () => void
  onSave?: () => void
  onSaveAs?: () => void
}

const SimpleToolbar: React.FC<SimpleToolbarProps> = ({
  activeClipId,
  canUndo,
  canRedo,
  onNewClick,
  onMergeClips,
  onUndo,
  onRedo,
  onSplitClip,
  onToggleTemplateSidebar,
  onSave,
  onSaveAs,
}) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  const handleExportClick = () => {
    setIsExportModalOpen(true)
  }

  const handleExportConfirm = (format: ExportFormat) => {
    // TODO: Implement actual export functionality based on format
    console.log('Exporting in format:', format)
  }

  const handleCloseModal = () => {
    setIsExportModalOpen(false)
  }

  const handleOpenProject = () => {
    // TODO: 프로젝트 열기 기능 구현
    console.log('Open project functionality to be implemented')
  }

  return (
    <ToolbarBase variant="base">
      <div className="flex items-center w-full">
        {/* 툴바 컨텐츠 */}
        <div className="flex items-center space-x-3 flex-1">
          {/* 새로 만들기 */}
          <ToolbarButton
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
            label="새로 만들기"
            onClick={onNewClick}
            shortcut="Ctrl+N"
          />

          {/* 프로젝트 열기 */}
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
            label="프로젝트 열기"
            onClick={handleOpenProject}
            shortcut="Ctrl+O"
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
            disabled={!activeClipId}
            shortcut="Enter"
          />

          {/* 템플릿 */}
          <ToolbarButton
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            }
            label="템플릿"
            onClick={onToggleTemplateSidebar}
          />
        </div>

        {/* 프로젝트 저장 버튼들과 내보내기 버튼 - 항상 오른쪽 끝에 고정 */}
        <div className="ml-4 flex items-center space-x-3">
          {/* 프로젝트 저장 */}
          <ToolbarButton
            icon={<AiOutlineSave className="w-5 h-5" />}
            label="프로젝트 저장"
            onClick={onSave}
            shortcut="Ctrl+S"
          />

          {/* 다른 프로젝트로 저장 */}
          <ToolbarButton
            icon={<AiOutlineFolderAdd className="w-5 h-5" />}
            label="다른 프로젝트로 저장"
            onClick={onSaveAs}
          />

          {/* 내보내기 - 원래 스타일 유지 */}
          <button
            className="px-5 py-3 bg-gray-600 text-white rounded hover:bg-black hover:scale-105 hover:shadow-lg transition-all duration-200 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            onClick={handleExportClick}
          >
            <AiOutlineExport className="w-4 h-4" />
            내보내기
          </button>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={handleCloseModal}
        onExport={handleExportConfirm}
      />
    </ToolbarBase>
  )
}

export default SimpleToolbar
