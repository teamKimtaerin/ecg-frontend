'use client'

import React from 'react'
import Tooltip from '@/components/ui/Tooltip'

interface ToolbarButtonProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
  active?: boolean
  shortcut?: string
  className?: string
}

/**
 * 툴바 버튼 컴포넌트
 * 아이콘과 라벨을 포함한 세로형 버튼
 */
export default function ToolbarButton({
  icon,
  label,
  onClick,
  disabled = false,
  active = false,
  shortcut,
  className = '',
}: ToolbarButtonProps) {
  const buttonClasses = `
    flex flex-col items-center space-y-1 px-2 py-1 rounded cursor-pointer transition-colors
    ${
      disabled
        ? 'text-black cursor-not-allowed'
        : active
          ? 'bg-black/10 text-black hover:bg-gray-200'
          : 'hover:bg-gray-200 text-black'
    }
    ${className}
  `

  const content = (
    <div className={buttonClasses} onClick={disabled ? undefined : onClick}>
      <div
        className={`w-5 h-5 ${disabled ? 'text-gray-400' : active ? 'text-black' : 'text-gray-600'}`}
      >
        {icon}
      </div>
      <span
        className={`text-xs ${disabled ? 'text-gray-400' : active ? 'text-black' : 'text-gray-600'}`}
      >
        {label}
      </span>
    </div>
  )

  if (shortcut && !disabled) {
    return (
      <Tooltip content={label} shortcut={shortcut} disabled={disabled}>
        {content}
      </Tooltip>
    )
  }

  return content
}
