'use client'

import React, { useState, useEffect } from 'react'
import AssetCard, { AssetItem } from './AssetCard'
import { useEditorStore } from '../../store'
import { showToast } from '@/utils/ui/toast'
import {
  determineTargetWordIds,
  isMultipleWordsSelected,
  canAddAnimationToSelection,
} from '../../utils/animationHelpers'

interface AssetGridProps {
  onAssetSelect?: (asset: AssetItem) => void
}

interface AssetDatabaseItem {
  id: string
  title: string
  category: string
  description: string
  thumbnail?: string
  pluginKey?: string
  thumbnailPath?: string
  iconName?: string
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
    focusedWordId,
    addAnimationTrackAsync,
    wordAnimationTracks,
    multiSelectedWordIds,
  } = useEditorStore()

  // Load favorite assets from localStorage
  const [favoriteAssetIds, setFavoriteAssetIds] = useState<Set<string>>(
    new Set()
  )

  useEffect(() => {
    const loadFavorites = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('asset-favorites')
        if (saved) {
          try {
            const parsedFavorites = JSON.parse(saved)
            setFavoriteAssetIds(
              new Set(Array.isArray(parsedFavorites) ? parsedFavorites : [])
            )
          } catch (error) {
            console.error('Failed to parse saved favorites:', error)
          }
        }
      }
    }

    loadFavorites()

    // Listen for storage changes (when user toggles favorites in asset store)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'asset-favorites') {
        loadFavorites()
      }
    }

    // Listen for custom event (same-tab synchronization)
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent
      console.log('Editor - Received favorites update:', customEvent.detail)
      setFavoriteAssetIds(new Set(customEvent.detail))
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
      window.addEventListener('asset-favorites-updated', handleCustomEvent)
      return () => {
        window.removeEventListener('storage', handleStorageChange)
        window.removeEventListener('asset-favorites-updated', handleCustomEvent)
      }
    }
  }, [])

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

        const origin = (
          process.env.NEXT_PUBLIC_MOTIONTEXT_PLUGIN_ORIGIN ||
          'http://localhost:3300'
        ).replace(/\/$/, '')

        // Transform JSON data to AssetItem format
        const transformedAssets: AssetItem[] = data.assets.map((asset) => {
          let thumb = asset.thumbnail || '/placeholder-thumb.jpg'
          if (asset.pluginKey) {
            const base = `${origin}/plugins/${asset.pluginKey}`
            thumb = `${base}/${asset.thumbnailPath || 'assets/thumbnail.svg'}`
          }
          return {
            id: asset.id,
            name: asset.title,
            category: asset.category,
            type: 'free' as const,
            pluginKey: asset.pluginKey,
            iconName: asset.iconName,
            preview: {
              type: 'image' as const,
              value: thumb,
            },
          }
        })

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
      // '내 에셋' tab - show only favorite assets
      console.log(
        `Editor - Checking asset ${asset.id} (${asset.name}), isFavorite:`,
        favoriteAssetIds.has(asset.id)
      )

      if (!favoriteAssetIds.has(asset.id)) {
        return false
      }
    } else if (activeAssetTab === 'free') {
      // '무료 에셋' tab - show all assets EXCEPT favorites
      if (favoriteAssetIds.has(asset.id)) {
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

  const handleAssetClick = async (asset: AssetItem) => {
    const store = useEditorStore.getState()
    const isMultiSelection = isMultipleWordsSelected(store)
    const targetWordIds = determineTargetWordIds(store)

    // Check if multiple words are selected for batch operations
    if (isMultiSelection && multiSelectedWordIds.size > 1) {
      // Check animation limit before applying
      const limitCheck = canAddAnimationToSelection(store, targetWordIds)

      if (!limitCheck.canAdd) {
        const blockedCount = limitCheck.blockedWords.length
        showToast(
          `${blockedCount}개 단어가 이미 3개의 애니메이션을 가지고 있어 추가할 수 없습니다.`,
          'error'
        )
        return
      }

      // Centralized batch toggle for scenario + UI sync (async)
      try {
        await useEditorStore
          .getState()
          .toggleAnimationForWords(Array.from(multiSelectedWordIds), {
            id: asset.id,
            name: asset.name,
            pluginKey: asset.pluginKey,
          })
        showToast(
          `${multiSelectedWordIds.size}개 단어에 애니메이션을 적용/해제했습니다.`,
          'success'
        )
      } catch (error) {
        console.error('Failed to apply animation to multiple words:', error)
        showToast('애니메이션 적용 중 오류가 발생했습니다.', 'error')
      }
      return
    }

    // Also update the UI state for compatibility
    const isCurrentlySelected = currentWordAssets.includes(asset.id)
    let newSelectedAssets: string[]

    if (isCurrentlySelected) {
      // 제거
      newSelectedAssets = currentWordAssets.filter((id) => id !== asset.id)
    } else {
      // 추가 - 최대 3개 제한 확인
      if (currentWordAssets.length >= 3) {
        showToast('최대 3개의 애니메이션만 선택할 수 있습니다.', 'warning')
        return // Don't proceed with the click
      }

      // Check single word animation limit for non-multi-selection
      if (targetWordIds.length === 1) {
        const limitCheck = canAddAnimationToSelection(store, targetWordIds)
        if (!limitCheck.canAdd) {
          showToast(
            '선택한 단어가 이미 3개의 애니메이션을 가지고 있습니다.',
            'error'
          )
          return
        }
      }

      newSelectedAssets = [...currentWordAssets, asset.id]
    }

    // Single word operation (original logic)
    const singleTargetWordId =
      focusedWordId ||
      selectedWordId ||
      (multiSelectedWordIds.size === 1
        ? Array.from(multiSelectedWordIds)[0]
        : null)
    if (singleTargetWordId) {
      const currentTracks = wordAnimationTracks.get(singleTargetWordId) || []

      // Check if already added
      if (currentTracks.find((t) => t.assetId === asset.id)) {
        // If already exists, remove it
        const { removeAnimationTrack } = useEditorStore.getState()
        removeAnimationTrack(singleTargetWordId, asset.id)
      } else if (currentTracks.length < 3) {
        // Find the word to get its timing using index cache
        let wordTiming = undefined
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const store = useEditorStore.getState() as any
          const entry = store.getWordEntryById?.(singleTargetWordId)
          if (entry?.word) {
            wordTiming = { start: entry.word.start, end: entry.word.end }
          }
        } catch {}
        // Add the animation track with word timing - this creates the bars immediately
        await addAnimationTrackAsync(
          singleTargetWordId,
          asset.id,
          asset.name,
          wordTiming,
          asset.pluginKey
        )
      } else {
        // Show toast when trying to add more than 3 animations
        showToast('최대 3개의 애니메이션만 선택할 수 있습니다.', 'warning')
        return // Don't proceed with the click
      }
    }

    // Update current word assets in UI state
    setCurrentWordAssets(newSelectedAssets)

    // If a word is selected, apply the asset changes to it
    if (selectedWordId) {
      // Use index to resolve clipId quickly
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const store = useEditorStore.getState() as any
        const clipId = store.getClipIdByWordId?.(selectedWordId)
        if (clipId) {
          applyAssetsToWord(clipId, selectedWordId, newSelectedAssets)
        }
      } catch {}
    }

    // console.log(
    //   'Asset toggled:',
    //   asset.name,
    //   isCurrentlySelected ? 'removed' : 'added'
    // )
    onAssetSelect?.(asset)
    // Note: addAnimationTrackAsync and removeAnimationTrack handle refreshWordPluginChain internally
  }

  // Show loading state
  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-700 text-sm">에셋을 불러오는 중...</p>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 text-sm">에셋을 불러오는데 실패했습니다.</p>
        <p className="text-slate-400 text-xs mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div>
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
                isFavorite: favoriteAssetIds.has(asset.id),
              }}
              onClick={handleAssetClick}
            />
          )
        })}
      </div>

      {!loading && !error && filteredAssets.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-700 text-sm">
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
