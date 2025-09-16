'use client'

import React from 'react'
import Image from 'next/image'
import { IoStar } from 'react-icons/io5'

export interface AssetItem {
  id: string
  name: string
  category: string
  type: 'free' | 'premium' | 'my'
  preview: {
    type: 'color' | 'gradient' | 'image'
    value: string
    secondary?: string
  }
  isUsed?: boolean
  isFavorite?: boolean
  description?: string
}

interface AssetCardProps {
  asset: AssetItem
  onClick?: (asset: AssetItem) => void
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, onClick }) => {
  const handleClick = () => {
    onClick?.(asset)
  }

  const renderPreview = () => {
    const { preview } = asset

    if (preview.type === 'gradient') {
      return (
        <div
          className="w-full h-full rounded-lg flex items-center justify-center text-white text-lg font-bold"
          style={{
            background: `linear-gradient(135deg, ${preview.value}, ${preview.secondary || preview.value})`,
          }}
        >
          {asset.name === 'CI' ? 'CI' : ''}
          {asset.name.includes('화려한') && (
            <div className="w-8 h-8 bg-white/30 rounded-full" />
          )}
        </div>
      )
    }

    if (preview.type === 'color') {
      return (
        <div
          className="w-full h-full rounded-lg flex items-center justify-center text-white text-lg font-bold"
          style={{
            backgroundColor: preview.value,
          }}
        >
          {asset.name === 'CI' ? 'CI' : ''}
        </div>
      )
    }

    // For image type
    return (
      <div className="w-full h-full rounded-lg bg-slate-800/50 flex items-center justify-center overflow-hidden relative">
        <Image
          src={preview.value}
          alt={asset.name}
          fill
          className="object-cover rounded-lg"
          sizes="(max-width: 768px) 50vw, 200px"
        />
      </div>
    )
  }

  return (
    <div
      className="group relative bg-slate-700/50 rounded-lg p-3 cursor-pointer hover:bg-slate-600/50 transition-all duration-200 border border-slate-600/30 hover:border-slate-500/50"
      onClick={handleClick}
    >
      {/* Preview Area with Badge Overlay */}
      <div className="relative aspect-[4/3] mb-3 rounded-lg overflow-hidden">
        {renderPreview()}

        {/* Star Icon for Favorites */}
        {asset.isFavorite && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-yellow-500 rounded-md flex items-center justify-center shadow-lg">
            <IoStar size={14} className="text-white" />
          </div>
        )}

        {/* Used Badge */}
        {asset.isUsed && (
          <span className="absolute top-2 left-2 inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/90 text-white backdrop-blur-sm shadow-sm">
            사용중
          </span>
        )}
      </div>

      {/* Asset Info */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-white leading-tight">
          {asset.name}
        </h3>

        {asset.description && (
          <p className="text-xs text-slate-400 leading-tight">
            {asset.description}
          </p>
        )}
      </div>
    </div>
  )
}

export default AssetCard
