'use client'

import { clsx } from 'clsx'
import { TRANSITIONS, type BaseComponentProps } from '@/lib/utils'
import React from 'react'

// Asset 사이드바 Props 타입
interface AssetSidebarProps extends BaseComponentProps {
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
  categories?: string[]
  favoriteCount?: number
  onFavoriteClick?: () => void
  onUploadClick?: () => void
}

// Asset 사이드바 컴포넌트
export const AssetSidebar: React.FC<AssetSidebarProps> = ({
  // Remove unused props
  favoriteCount = 0,
  onFavoriteClick,
  onUploadClick,
  className,
}) => {
  // 사이드바 클래스
  const sidebarClasses = clsx(
    'w-48', // 폭 축소 (256px -> 192px)
    'bg-white', // 화이트 배경
    'border-r',
    'border-gray-100', // 미세한 보더
    'min-h-screen',
    'p-5',
    'flex',
    'flex-col',
    className
  )

  // 즐겨찾기 버튼 클래스
  const favoriteButtonClasses = clsx(
    'w-full',
    'text-left',
    'px-4',
    'py-2.5',
    'rounded-md',
    'font-medium',
    'text-sm',
    'flex',
    'items-center',
    'justify-between',
    'bg-black',
    'text-white',
    'hover:bg-gray-800',
    TRANSITIONS.colors
  )

  // 업로드 버튼 클래스
  const uploadButtonClasses = clsx(
    'w-full',
    'px-4',
    'py-3',
    'bg-black',
    'text-white',
    'rounded-md',
    'font-medium',
    'text-sm',
    'text-center',
    'hover:bg-gray-800',
    TRANSITIONS.colors
  )

  return (
    <aside className={sidebarClasses}>
      {/* Favorites 섹션 */}
      <div className="mb-6">
        <h3 className="text-black text-base font-semibold mb-5 tracking-wide">
          Favorites
        </h3>
        <button onClick={onFavoriteClick} className={favoriteButtonClasses}>
          <span className="flex items-center">
            <span className="text-lg mr-2">⭐</span>
            Box
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {favoriteCount}
          </span>
        </button>
      </div>

      {/* Upload 섹션 */}
      <div className="mb-6">
        <h3 className="text-black text-base font-semibold mb-5 tracking-wide">
          Upload
        </h3>
        <button onClick={onUploadClick} className={uploadButtonClasses}>
          <span className="mr-2">+</span>
          Upload Asset
        </button>
      </div>
    </aside>
  )
}
