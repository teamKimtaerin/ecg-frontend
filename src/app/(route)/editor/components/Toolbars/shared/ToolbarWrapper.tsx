'use client'

import React from 'react'
import Button from '@/components/ui/Button'
import ToolbarBase from './ToolbarBase'
import { type ToolbarVariant } from '../../../constants/colors'

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
  const handleExport = () => {
    // TODO: Implement export functionality
    // - Export current project as subtitle file (SRT, VTT, etc.)
    // - Show export format selection dialog
    // - Handle export progress and completion
    console.log('Export button clicked')
    onExport?.()
  }

  return (
    <ToolbarBase variant={variant} className={className}>
      <div className="flex items-center w-full">
        {/* 툴바별 컨텐츠 */}
        <div className="flex items-center space-x-3 flex-1">{children}</div>

        {/* 내보내기 버튼 - 항상 오른쪽 끝에 고정 */}
        <Button
          variant="accent"
          size="medium"
          className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm hover:shadow-md transition-all duration-200 hover:from-blue-600 hover:to-indigo-700"
          onClick={handleExport}
        >
          내보내기
        </Button>
      </div>
    </ToolbarBase>
  )
}
