'use client'

import React, { useState } from 'react'
import ToolbarBase from './ToolbarBase'
import { type ToolbarVariant } from '../../../constants/colors'
import { AiOutlineExport } from 'react-icons/ai'
import ExportModal from '../../Export/ExportModal'
import { ExportFormat } from '../../Export/ExportTypes'

interface ToolbarWrapperProps {
  variant?: ToolbarVariant
  children: React.ReactNode
  onExport?: () => void
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

  return (
    <ToolbarBase variant={variant} className={className}>
      <div className="flex items-center w-full">
        {/* 툴바별 컨텐츠 */}
        <div className="flex items-center space-x-3 flex-1">{children}</div>

        {/* 내보내기 버튼 - 항상 오른쪽 끝에 고정 */}
        <button
          className="ml-4 px-4 py-2 bg-[#14B0DA] text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:bg-[#12A0C8] flex items-center gap-2 font-medium"
          onClick={handleExportClick}
        >
          <AiOutlineExport className="w-5 h-5" />
          내보내기
        </button>
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
