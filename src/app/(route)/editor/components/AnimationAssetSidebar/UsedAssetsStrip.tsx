'use client'

import React, { useState, useEffect } from 'react'
import {
  IoClose,
  IoRefresh,
  IoChevronUp,
  IoExpand,
  IoDocument,
  IoEye,
  IoTrendingUp,
  IoFlash,
  IoArrowBack,
} from 'react-icons/io5'
import { useEditorStore } from '../../store'
import { AssetItem } from './AssetCard'

interface AssetDatabaseItem {
  id: string
  title: string
  category: string
  description: string
  thumbnail: string
  isPro: boolean
}

interface AssetDatabase {
  assets: AssetDatabaseItem[]
}

const UsedAssetsStrip: React.FC = () => {
  const {
    currentWordAssets,
    setCurrentWordAssets,
    selectedWordId,
    applyAssetsToWord,
    clips,
  } = useEditorStore()

  const [allAssets, setAllAssets] = useState<AssetItem[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch assets from JSON file
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true)
        const response = await fetch('/asset-store/assets-database.json')
        if (!response.ok) {
          throw new Error('Failed to fetch assets')
        }
        const data: AssetDatabase = await response.json()

        // Transform JSON data to AssetItem format
        const transformedAssets: AssetItem[] = data.assets.map((asset) => ({
          id: asset.id,
          name: asset.title,
          category: asset.category,
          type: 'free' as const,
          preview: {
            type: 'image' as const,
            value: asset.thumbnail,
          },
          description: asset.description,
        }))

        setAllAssets(transformedAssets)
      } catch (err) {
        console.error('Failed to fetch assets:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
  }, [])

  // Get used assets in selection order (left to right: 1, 2, 3...)
  const usedAssets = currentWordAssets
    .map((id) => allAssets.find((asset) => asset.id === id))
    .filter((asset) => asset !== undefined) as AssetItem[]

  // Get asset selection order based on array index
  const getAssetOrder = (index: number) => {
    return index + 1
  }

  // Get characteristic icon for each asset type
  const getAssetIcon = (assetName: string) => {
    const iconMap = {
      'Rotation Text': IoRefresh,
      'TypeWriter Effect': IoDocument,
      'Elastic Bounce': IoChevronUp,
      'Glitch Effect': IoFlash,
      'Magnetic Pull': IoArrowBack,
      'Fade In Stagger': IoEye,
      'Scale Pop': IoExpand,
      'Slide Up': IoTrendingUp,
    }
    return iconMap[assetName as keyof typeof iconMap] || null
  }

  const handleRemoveAsset = (assetId: string) => {
    const newAssets = currentWordAssets.filter((id) => id !== assetId)
    setCurrentWordAssets(newAssets)

    // If a word is selected, apply the changes to the word
    if (selectedWordId) {
      const targetClip = clips.find((clip) =>
        clip.words.some((word) => word.id === selectedWordId)
      )

      if (targetClip) {
        applyAssetsToWord(targetClip.id, selectedWordId, newAssets)
      }
    }
  }

  if (loading) {
    return (
      <div className="px-4 pb-3">
        <h3 className="text-sm font-medium text-white mb-2">사용중 에셋</h3>
        <div className="text-xs text-slate-400">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="px-4 pb-3">
      <h3 className="text-sm font-medium text-white mb-2">
        사용중 에셋 ({usedAssets.length}개)
      </h3>

      {usedAssets.length === 0 ? (
        <div className="text-xs text-slate-400 py-2">
          사용중인 에셋이 없습니다.
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-2 pt-6 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          {usedAssets.map((asset, index) => (
            <div
              key={asset.id}
              className="flex-shrink-0 relative group bg-slate-700/50 rounded-lg overflow-visible"
              style={{ width: '80px' }}
            >
              {/* Characteristic Icon */}
              {(() => {
                const IconComponent = getAssetIcon(asset.name)
                return IconComponent ? (
                  <div
                    className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-slate-800/90 rounded-full w-6 h-6 flex items-center justify-center shadow-sm"
                    style={{ zIndex: 10 }}
                  >
                    <IconComponent size={14} className="text-slate-300" />
                  </div>
                ) : null
              })()}

              {/* Thumbnail */}
              <div className="aspect-[4/3] bg-slate-800/50 flex items-center justify-center overflow-hidden">
                <img
                  src={asset.preview.value}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Order Badge */}
              <div
                className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 rounded-md flex items-center justify-center text-white text-xs font-bold shadow-lg flex-shrink-0"
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  minWidth: '20px',
                  minHeight: '20px',
                  fontSize: '10px',
                  boxSizing: 'border-box',
                }}
                aria-label={`선택 순서 ${getAssetOrder(index)}번`}
              >
                {getAssetOrder(index)}
              </div>

              {/* Asset Name */}
              <div className="px-1 py-1">
                <p className="text-xs text-white truncate leading-tight">
                  {asset.name}
                </p>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleRemoveAsset(asset.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg flex-shrink-0"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  minWidth: '24px',
                  minHeight: '24px',
                  boxSizing: 'border-box',
                }}
                aria-label={`${asset.name} 제거`}
              >
                <IoClose size={14} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UsedAssetsStrip
