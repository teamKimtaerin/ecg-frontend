'use client'

import React, { useState } from 'react'
import { useEditorStore } from '../../store'

// Components
import SidebarHeader from './SidebarHeader'
import SearchBar from './SearchBar'
import UsedAssetsStrip from './UsedAssetsStrip'
import TabNavigation from './TabNavigation'
import AssetGrid from './AssetGrid'
import AssetControlPanel from './AssetControlPanel'
import { AssetItem } from './AssetCard'

interface AnimationAssetSidebarProps {
  className?: string
  onAssetSelect?: (asset: AssetItem) => void
  onClose?: () => void
}

const AnimationAssetSidebar: React.FC<AnimationAssetSidebarProps> = ({
  className,
  onAssetSelect,
  onClose,
}) => {
  const { isAssetSidebarOpen, assetSidebarWidth, selectedWordId, clips } =
    useEditorStore()

  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null)
  const [expandedAssetName, setExpandedAssetName] = useState<string | null>(
    null
  )

  // Find selected word info
  const selectedWordInfo = React.useMemo(() => {
    if (!selectedWordId) return null

    for (const clip of clips) {
      const word = clip.words.find((w) => w.id === selectedWordId)
      if (word) {
        return { word, clipId: clip.id }
      }
    }
    return null
  }, [selectedWordId, clips])

  if (!isAssetSidebarOpen) {
    return null
  }

  const handleAssetSelect = (asset: AssetItem) => {
    // Here you would typically apply the glitch effect to the focused clip
    console.log('Selected asset:', asset)
    onAssetSelect?.(asset)

    // TODO: Implement actual glitch effect application to focused clip
    // This would integrate with the existing clip editing system
  }

  const handleExpandedAssetChange = (
    assetId: string | null,
    assetName: string | null
  ) => {
    setExpandedAssetId(assetId)
    setExpandedAssetName(assetName)
  }

  const handleControlPanelClose = () => {
    setExpandedAssetId(null)
    setExpandedAssetName(null)
  }

  const handleSettingsChange = (settings: Record<string, unknown>) => {
    console.log('Settings changed:', settings)
    // Apply settings to the animation track for the focused word
    const store = useEditorStore.getState() as any
    const wordId = store.focusedWordId as string | null
    const assetId = expandedAssetId
    if (wordId && assetId) {
      store.updateAnimationTrackParams?.(wordId, assetId, settings)
      store.refreshWordPluginChain?.(wordId)
    }
  }

  return (
    <div
      className={`relative flex-shrink-0 bg-white border-l border-gray-200 flex flex-col h-full ${className || ''}`}
      style={{ width: assetSidebarWidth }}
    >
      {/* Header */}
      <SidebarHeader onClose={onClose} />

      {/* Word Selection Indicator */}
      {selectedWordInfo && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
          <div className="text-xs text-blue-600">
            선택된 단어:{' '}
            <span className="font-medium text-blue-800">
              &ldquo;{selectedWordInfo.word.text}&rdquo;
            </span>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex-shrink-0 pt-4 relative">
        <SearchBar />

        {/* Used Assets Strip */}
        <UsedAssetsStrip onExpandedAssetChange={handleExpandedAssetChange} />

        {/* AssetControlPanel - Below UsedAssetsStrip, centered vertically in viewport */}
        {expandedAssetId && expandedAssetName && (
          <div
            className="absolute left-0 right-0 px-4 z-50"
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <AssetControlPanel
              assetName={expandedAssetName}
              onClose={handleControlPanelClose}
              onSettingsChange={handleSettingsChange}
            />
          </div>
        )}

        <TabNavigation />
      </div>

      {/* Scrollable Asset Grid */}
      <div className="flex-1 overflow-y-auto">
        <AssetGrid onAssetSelect={handleAssetSelect} />
      </div>
    </div>
  )
}

export default AnimationAssetSidebar
