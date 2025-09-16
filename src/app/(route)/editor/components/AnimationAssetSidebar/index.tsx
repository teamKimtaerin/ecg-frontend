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
}

const AnimationAssetSidebar: React.FC<AnimationAssetSidebarProps> = ({
  className,
  onAssetSelect,
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
    // TODO: Apply settings to animation track
  }

  return (
    <div
      className={`relative flex-shrink-0 bg-gray-900 border-l border-slate-600/40 flex flex-col h-full ${className || ''}`}
      style={{ width: assetSidebarWidth }}
    >
      {/* Header */}
      <SidebarHeader />

      {/* Word Selection Indicator */}
      {selectedWordInfo && (
        <div className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/20">
          <div className="text-xs text-blue-300">
            선택된 단어:{' '}
            <span className="font-medium text-blue-100">
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
