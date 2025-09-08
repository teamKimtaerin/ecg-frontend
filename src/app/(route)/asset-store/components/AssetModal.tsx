'use client'

import { clsx } from 'clsx'
import {
  logComponentWarning,
  TRANSITIONS,
  type BaseComponentProps,
} from '@/lib/utils'
import React from 'react'

// Modal Props 타입
interface ModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  variant?: 'default' | 'large' | 'fullscreen'
}

// Modal 컴포넌트
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  variant = 'default',
  className,
}) => {
  if (!isOpen) return null

  // 검증
  if (!title) {
    logComponentWarning('Modal', 'Title should be provided for accessibility')
  }

  // 모달 오버레이 클래스
  const overlayClasses = clsx(
    'fixed',
    'inset-0',
    'z-50',
    'flex',
    'items-center',
    'justify-center'
  )

  // 배경 클래스
  const backdropClasses = clsx(
    'absolute',
    'inset-0',
    'bg-black/60',
    'backdrop-blur-sm'
  )

  // 모달 컨테이너 클래스
  const modalClasses = clsx(
    'relative',
    'bg-white',
    'rounded-lg',
    'mx-4',
    'overflow-hidden',
    'border',
    'border-gray-200',
    'shadow-xl',

    // 크기 변형
    variant === 'large' && 'max-w-7xl w-full max-h-[95vh]',
    variant === 'fullscreen' &&
      'w-full h-full max-w-none max-h-none m-0 rounded-none',
    variant === 'default' && 'max-w-2xl w-full max-h-[90vh]',

    className
  )

  // 헤더 클래스
  const headerClasses = clsx(
    'flex',
    'items-center',
    'justify-between',
    'p-4',
    'border-b',
    'border-gray-300',
    'bg-black'
  )

  return (
    <div className={overlayClasses}>
      <div className={backdropClasses} onClick={onClose} />
      <div className={modalClasses}>
        <div className={headerClasses}>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className={clsx(
              'text-gray-400',
              'hover:text-white',
              'text-2xl',
              'font-bold',
              'w-8',
              'h-8',
              'flex',
              'items-center',
              'justify-center',
              'rounded',
              'hover:bg-gray-800',
              TRANSITIONS.colors
            )}
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto max-h-[85vh]">{children}</div>
      </div>
    </div>
  )
}
