'use client'

import { AssetCard } from '@/app/(route)/asset-store/components/AssetCard'
import { Modal } from '@/app/(route)/asset-store/components/AssetModal'
import { AssetSidebar } from '@/app/(route)/asset-store/components/AssetSidebar'
import { GSAPTextEditor } from '@/app/(route)/asset-store/components/GSAPTextEditor'
import { clsx } from 'clsx'
import { TRANSITIONS } from '@/lib/utils'
import { AssetItem } from '@/types/asset-store'
import { useState, useEffect } from 'react'
import { LuSearch } from 'react-icons/lu'

// 메인 페이지 컴포넌트
export default function AssetPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('Smooth')
  const [activeFilter, setActiveFilter] = useState('All')
  const [showFavorites, setShowFavorites] = useState(false)

  // 카테고리 필터 버튼 목록
  const categoryFilters = [
    { id: 'All', label: 'All', count: 8 },
    { id: 'Smooth', label: 'Smooth', count: 3 },
    { id: 'Dynamic', label: 'Dynamic', count: 3 },
    { id: 'Unique', label: 'Unique', count: 2 },
  ]

  const [assets, setAssets] = useState<AssetItem[]>([])

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const response = await fetch('/asset-store/assets-database.json')
        const data = await response.json()
        setAssets(data.assets)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load assets:', error)
        setIsLoading(false)
      }
    }
    loadAssets()
  }, [])
  const [isLoading, setIsLoading] = useState(true)

  const handleCardClick = (asset: AssetItem) => {
    if (
      asset.id === '1' ||
      asset.id === '2' ||
      asset.id === '3' ||
      asset.id === '4' ||
      asset.id === '5' ||
      asset.id === '6' ||
      asset.id === '7' ||
      asset.id === '8'
    ) {
      setSelectedAsset(asset)
      setIsModalOpen(true)
    }
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
  }

  const handleFavoriteClick = () => {
    setShowFavorites(!showFavorites)
    // 즐겨찾기 모드 활성화 시 다른 필터 초기화
    if (!showFavorites) {
      setActiveFilter('All')
    }
  }

  const handleUploadClick = () => {
    console.log('에셋 업로드 클릭됨')
  }

  const handleAddToCart = () => {
    console.log('아이템이 카트에 추가되었습니다:', selectedAsset?.title)
  }

  const handleLikeClick = (assetId: string) => {
    setAssets((prevAssets) =>
      prevAssets.map((asset) =>
        asset.id === assetId
          ? { ...asset, likes: (asset.likes || 0) + 1 }
          : asset
      )
    )
  }

  const handleFavoriteToggle = (assetId: string) => {
    setAssets((prevAssets) =>
      prevAssets.map((asset) =>
        asset.id === assetId
          ? { ...asset, isFavorite: !asset.isFavorite }
          : asset
      )
    )
  }

  // 즐겨찾기 개수 계산
  const favoriteCount = assets.filter((asset) => asset.isFavorite).length

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesCategory =
      activeFilter === 'All' || asset.category === activeFilter
    const matchesFavorites = !showFavorites || asset.isFavorite

    return matchesSearch && matchesCategory && matchesFavorites
  })

  // 메인 컨테이너 클래스
  const mainContainerClasses = clsx('min-h-screen', 'bg-gray-50', 'text-black')

  // 검색 컨테이너 클래스
  const searchContainerClasses = clsx('relative', 'w-80')

  // 검색 입력 클래스
  const searchInputClasses = clsx(
    'w-full',
    'pl-4',
    'pr-12', // 오른쪽 패딩을 늘려서 아이콘 공간 확보
    'py-2.5',
    'bg-white',
    'border',
    'border-gray-200',
    'rounded-lg',
    'text-black',
    'placeholder-gray-400',
    'focus:outline-none',
    'focus:border-black',
    'focus:ring-1',
    'focus:ring-black',
    'shadow-sm',
    TRANSITIONS.colors
  )

  // 검색 아이콘 클래스
  const searchIconClasses = clsx(
    'absolute',
    'right-3',
    'top-1/2',
    'transform',
    '-translate-y-1/2',
    'text-gray-400',
    'pointer-events-none'
  )

  // 카테고리 버튼 클래스
  const getCategoryButtonClasses = (isActive: boolean) =>
    clsx(
      'px-4',
      'py-2',
      'rounded-full',
      'text-sm',
      'font-medium',
      'border',
      'cursor-pointer',
      TRANSITIONS.colors,
      isActive
        ? ['bg-black', 'text-white', 'border-black']
        : [
            'bg-white',
            'text-gray-700',
            'border-gray-200',
            'hover:border-gray-300',
            'hover:bg-gray-50',
          ]
    )

  return (
    <div className={mainContainerClasses}>
      <div className="flex">
        <AssetSidebar
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          favoriteCount={favoriteCount}
          onFavoriteClick={handleFavoriteClick}
          onUploadClick={handleUploadClick}
        />

        <main className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-black">Asset Store</h1>

            <div className="flex items-center space-x-4">
              <div className={searchContainerClasses}>
                <input
                  type="text"
                  placeholder="Search assets"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={searchInputClasses}
                />
                <LuSearch className={searchIconClasses} size={20} />
              </div>
            </div>
          </div>

          {/* 카테고리 필터 버튼 */}
          <div className="flex items-center space-x-3 mb-8">
            {categoryFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={getCategoryButtonClasses(activeFilter === filter.id)}
              >
                <span>{filter.label}</span>
                <span className="ml-1.5 text-xs opacity-70">
                  ({filter.count})
                </span>
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-gray-500">Loading assets...</div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-6">
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onCardClick={handleCardClick}
                  onLikeClick={handleLikeClick}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedAsset?.title || ''}
        variant="large"
      >
        <GSAPTextEditor
          onAddToCart={handleAddToCart}
          configFile={selectedAsset?.configFile}
        />
      </Modal>
    </div>
  )
}
