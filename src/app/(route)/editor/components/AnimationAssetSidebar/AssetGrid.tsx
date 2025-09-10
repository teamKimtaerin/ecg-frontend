'use client'

import React, { useState, useEffect } from 'react'
import AssetCard, { AssetItem } from './AssetCard'
import { useEditorStore } from '../../store'

interface AssetGridProps {
  onAssetSelect?: (asset: AssetItem) => void
}

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

const AssetGrid: React.FC<AssetGridProps> = ({ onAssetSelect }) => {
  const {
    activeAssetTab,
    assetSearchQuery,
    currentWordAssets,
    setCurrentWordAssets,
    selectedWordId,
    applyAssetsToWord,
    clips,
    focusedWordId,
    addAnimationTrack,
    removeAnimationTrack,
    wordAnimationTracks,
  } = useEditorStore()

  // Hardcoded favorite assets for '담은 에셋' tab
  const favoriteAssetNames = [
    'TypeWriter Effect',
    'Rotation Text',
    'Elastic Bounce',
  ]

  const [assets, setAssets] = useState<AssetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

        setAssets(transformedAssets)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
  }, [])

  // Filter assets based on tab, category, and search query
  const filteredAssets = assets.filter((asset) => {
    // Filter by tab
    if (activeAssetTab === 'my') {
      // '담은 에셋' tab - show only favorite assets
      if (!favoriteAssetNames.includes(asset.name)) {
        return false
      }
    } else if (activeAssetTab === 'free') {
      // '무료 에셋' tab - show all assets EXCEPT favorites
      if (favoriteAssetNames.includes(asset.name)) {
        return false
      }
    }

    // Filter by search query
    if (assetSearchQuery) {
      const query = assetSearchQuery.toLowerCase()
      return (
        asset.name.toLowerCase().includes(query) ||
        asset.category.toLowerCase().includes(query) ||
        asset.description?.toLowerCase().includes(query)
      )
    }

    return true
  })

  const handleAssetClick = (asset: AssetItem) => {
    // If a word is focused, add/remove animation track for it
    if (focusedWordId) {
      const currentTracks = wordAnimationTracks.get(focusedWordId) || []

      // Check if already added
      if (currentTracks.find((t) => t.assetId === asset.id)) {
        // If already exists, remove it
        removeAnimationTrack(focusedWordId, asset.id)
      } else if (currentTracks.length < 3) {
        // Find the word to get its timing
        let wordTiming = undefined
        for (const clip of clips) {
          const word = clip.words?.find((w) => w.id === focusedWordId)
          if (word) {
            wordTiming = { start: word.start, end: word.end }
            break
          }
        }
        // Add the animation track with word timing - this creates the bars immediately
        addAnimationTrack(focusedWordId, asset.id, asset.name, wordTiming)
      } else {
        console.log('Maximum 3 animations per word')
      }
    }

    // Also update the UI state for compatibility
    const isCurrentlySelected = currentWordAssets.includes(asset.id)
    let newSelectedAssets: string[]

    if (isCurrentlySelected) {
      // 제거
      newSelectedAssets = currentWordAssets.filter((id) => id !== asset.id)
    } else {
      // 추가
      newSelectedAssets = [...currentWordAssets, asset.id]
    }

    // Update current word assets in UI state
    setCurrentWordAssets(newSelectedAssets)

    // If a word is selected, apply the asset changes to it
    if (selectedWordId) {
      // Find the clip containing the selected word
      const targetClip = clips.find((clip) =>
        clip.words.some((word) => word.id === selectedWordId)
      )

      if (targetClip) {
        applyAssetsToWord(targetClip.id, selectedWordId, newSelectedAssets)
      }
    }

    console.log(
      'Asset toggled:',
      asset.name,
      isCurrentlySelected ? 'removed' : 'added'
    )
    onAssetSelect?.(asset)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="px-4 pb-4">
        <div className="text-center py-8">
          <p className="text-slate-400 text-sm">에셋을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="px-4 pb-4">
        <div className="text-center py-8">
          <p className="text-red-400 text-sm">
            에셋을 불러오는데 실패했습니다.
          </p>
          <p className="text-slate-400 text-xs mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pb-4">
      <div className="grid grid-cols-2 gap-3">
        {filteredAssets.map((asset) => {
          // Check if this asset is applied to the focused word
          const focusedWordTracks = focusedWordId
            ? wordAnimationTracks.get(focusedWordId) || []
            : []
          const isAppliedToFocusedWord = focusedWordTracks.some(
            (track) => track.assetId === asset.id
          )

          return (
            <AssetCard
              key={asset.id}
              asset={{
                ...asset,
                isUsed:
                  isAppliedToFocusedWord ||
                  currentWordAssets.includes(asset.id),
                isFavorite: favoriteAssetNames.includes(asset.name),
              }}
              onClick={handleAssetClick}
            />
          )
        })}
      </div>

      {!loading && !error && filteredAssets.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-400 text-sm">
            {assetSearchQuery
              ? '검색 결과가 없습니다.'
              : '사용 가능한 에셋이 없습니다.'}
          </p>
        </div>
      )}
    </div>
  )
}

export default AssetGrid
