'use client'

import { clsx } from 'clsx'
import {
  logComponentWarning,
  TRANSITIONS,
  type BaseComponentProps,
} from '@/lib/utils'
import React, { useState, useCallback, useEffect } from 'react'
import { AssetItem } from '@/types/asset-store'
import { MotionTextPreview } from './MotionTextPreview'
import { PluginParameterControls } from './PluginParameterControls'
import { type PluginManifest } from '../utils/scenarioGenerator'

// Asset Modal Props 타입
interface AssetModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  asset: AssetItem | null
  onAddToCart?: () => void
}

// Asset Modal 컴포넌트
export const AssetModal: React.FC<AssetModalProps> = ({
  isOpen,
  onClose,
  asset,
  onAddToCart,
  className,
}) => {
  const [text, setText] = useState('SAMPLE TEXT')
  const [manifest, setManifest] = useState<PluginManifest | null>(null)
  const [parameters, setParameters] = useState<Record<string, unknown>>({})
  const previewRef = React.useRef<{
    updateParameters: (params: Record<string, unknown>) => void
  }>(null)

  // Body scroll lock + ESC close
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])

  /**
   * MotionTextPreview에서 manifest가 로드되면 상위로 전달
   */
  const handlePreviewManifestLoad = useCallback(
    (loadedManifest: PluginManifest) => {
      setManifest(loadedManifest)
    },
    []
  )

  /**
   * 파라미터 변경 핸들러
   */
  const handleParameterChange = useCallback((key: string, value: unknown) => {
    setParameters((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Child imperative update should happen after commit, not during render/event bubbling
  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.updateParameters(parameters)
    }
  }, [parameters])

  /**
   * 전체 파라미터 업데이트 (초기 로드 시)
   */
  const handleParametersInit = useCallback(
    (params: Record<string, unknown>) => {
      setParameters(params)
    },
    []
  )

  // 안정적인 에러 핸들러 (리렌더 시 함수 아이덴티티 고정)
  const handlePreviewError = useCallback((error: string) => {
    console.error('Preview Error:', error)
  }, [])

  // Early return은 모든 Hook 호출 이후에 배치
  if (!isOpen || !asset) return null

  // 검증
  if (!asset.title) {
    logComponentWarning(
      'AssetModal',
      'Asset title should be provided for accessibility'
    )
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
    'backdrop-blur-sm',
    'cursor-pointer'
  )

  // 모달 컨테이너 클래스
  const modalClasses = clsx(
    'relative',
    'bg-gray-900',
    'rounded-lg',
    'mx-4',
    'overflow-hidden',
    'border',
    'border-gray-700',
    'shadow-xl',
    'max-w-7xl',
    'w-full',
    'max-h-[95vh]',
    className
  )

  // 헤더 클래스
  const headerClasses = clsx(
    'flex',
    'items-center',
    'justify-between',
    'p-6',
    'border-b',
    'border-gray-700',
    'bg-gray-800'
  )

  return (
    <div className={overlayClasses}>
      <div className={backdropClasses} onClick={onClose} />
      <div className={modalClasses} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={headerClasses}>
          <div>
            <h2 className="text-2xl font-semibold text-white">{asset.title}</h2>
            <p className="text-gray-400 text-sm mt-1">{asset.description}</p>
          </div>
          <div className="flex items-center space-x-4">
            {onAddToCart && (
              <button
                onClick={onAddToCart}
                className={clsx(
                  'px-4 py-2 bg-blue-600 hover:bg-blue-700',
                  'text-white rounded-lg font-medium cursor-pointer',
                  TRANSITIONS.colors
                )}
              >
                Add to Cart
              </button>
            )}
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
                'hover:bg-gray-700',
                'cursor-pointer',
                TRANSITIONS.colors
              )}
              aria-label="닫기"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(95vh-120px)]">
          {/* 미리보기 영역 */}
          <div className="flex-1 min-h-0 p-6 overflow-y-auto">
            <div className="mb-4">
              <label className="block text-white text-sm font-medium mb-2">
                미리보기 텍스트
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className={clsx(
                  'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded',
                  'text-white placeholder-gray-400',
                  'focus:outline-none focus:border-blue-500',
                  TRANSITIONS.colors
                )}
                placeholder="미리보기에 표시될 텍스트를 입력하세요"
              />
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <MotionTextPreview
                ref={previewRef}
                manifestFile={asset.manifestFile || ''}
                text={text}
                onParameterChange={handleParametersInit}
                onManifestLoad={handlePreviewManifestLoad}
                onError={handlePreviewError}
                className="w-full max-h-[70vh]"
              />
            </div>

            {/* 에셋 정보 */}
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="text-gray-400">작성자</div>
                <div className="text-white">{asset.authorName}</div>
              </div>
              <div className="space-y-2">
                <div className="text-gray-400">카테고리</div>
                <div className="text-white">{asset.category}</div>
              </div>
              <div className="space-y-2">
                <div className="text-gray-400">다운로드</div>
                <div className="text-white">
                  {asset.downloads?.toLocaleString()}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-gray-400">평점</div>
                <div className="text-white">
                  {'★'.repeat(asset.rating || 0)}
                  {'☆'.repeat(5 - (asset.rating || 0))}
                </div>
              </div>
            </div>
          </div>

          {/* 파라미터 컨트롤 영역 */}
          <div className="w-80 bg-gray-800 border-l border-gray-700 p-6 overflow-y-auto">
            <PluginParameterControls
              manifest={manifest}
              parameters={parameters}
              onParameterChange={handleParameterChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// 기존 Modal 컴포넌트는 유지 (다른 곳에서 사용할 수 있음)
interface ModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  variant?: 'default' | 'large' | 'fullscreen'
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  variant = 'default',
  className,
}) => {
  if (!isOpen) return null

  const overlayClasses = clsx(
    'fixed',
    'inset-0',
    'z-50',
    'flex',
    'items-center',
    'justify-center'
  )

  const backdropClasses = clsx(
    'absolute',
    'inset-0',
    'bg-black/60',
    'backdrop-blur-sm',
    'cursor-pointer'
  )

  const modalClasses = clsx(
    'relative',
    'bg-white',
    'rounded-lg',
    'mx-4',
    'overflow-hidden',
    'border',
    'border-gray-200',
    'shadow-xl',
    variant === 'large' && 'max-w-7xl w-full max-h-[95vh]',
    variant === 'fullscreen' &&
      'w-full h-full max-w-none max-h-none m-0 rounded-none',
    variant === 'default' && 'max-w-2xl w-full max-h-[90vh]',
    className
  )

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
              'cursor-pointer',
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
