'use client'

import React, { useState } from 'react'
import {
  AiOutlineExport,
  AiOutlineFolderAdd,
  AiOutlineSave,
} from 'react-icons/ai'
import { type ToolbarVariant } from '../../../constants/colors'
import ExportModal from '../../Export/ExportModal'
import { ExportFormat } from '../../Export/ExportTypes'
import ToolbarBase from './ToolbarBase'
import ToolbarButton from './ToolbarButton'

interface ToolbarWrapperProps {
  variant?: ToolbarVariant
  children: React.ReactNode
  onExport?: () => void
  onSave?: () => void
  onSaveAs?: () => void
  className?: string
}

/**
 * 모든 툴바를 감싸는 wrapper 컴포넌트
 * 내보내기 버튼을 항상 오른쪽에 고정 배치
 */
export default function ToolbarWrapper({
  variant = 'base',
  children,
  onExport,
  onSave,
  onSaveAs,
  className = '',
}: ToolbarWrapperProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  const handleExportClick = () => {
    setIsExportModalOpen(true)
  }

  const handleExportConfirm = (format: ExportFormat) => {
    // TODO: Implement actual export functionality based on format
    console.log('Exporting in format:', format)
    onExport?.()
  }

  const handleCloseModal = () => {
    setIsExportModalOpen(false)
  }

  const handleSave = () => {
    onSave?.()
  }

  const handleSaveAs = () => {
    onSaveAs?.()
  }

  return (
    <ToolbarBase variant={variant} className={className}>
      <div className="flex items-center w-full">
        {/* 툴바별 컨텐츠 */}
        <div className="flex items-center space-x-3 flex-1">
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(
                  child as React.ReactElement<{ variant?: ToolbarVariant }>,
                  { variant }
                )
              : child
          )}
        </div>

        {/* 프로젝트 저장 버튼들과 내보내기 버튼 - 항상 오른쪽 끝에 고정 */}
        <div className="ml-4 flex items-center space-x-3">
          {/* 프로젝트 저장 */}
          <ToolbarButton
            icon={<AiOutlineSave className="w-5 h-5" />}
            label="프로젝트 저장"
            onClick={handleSave}
            shortcut="Ctrl+S"
            variant={variant}
          />

          {/* 다른 프로젝트로 저장 */}
          <ToolbarButton
            icon={<AiOutlineFolderAdd className="w-5 h-5" />}
            label="다른 프로젝트로 저장"
            onClick={handleSaveAs}
            variant={variant}
          />

          {/* 내보내기 - variant에 따라 다른 스타일 적용 */}
          <button
            className={`px-5 py-3 rounded hover:scale-105 hover:shadow-lg transition-all duration-200 flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
              variant === 'dark'
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-gray-600 text-white hover:bg-black'
            }`}
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
