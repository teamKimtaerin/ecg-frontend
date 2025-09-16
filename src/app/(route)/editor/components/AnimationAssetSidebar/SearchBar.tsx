'use client'

import React from 'react'
import { IoSearch } from 'react-icons/io5'
import { useEditorStore } from '../../store'

const SearchBar: React.FC = () => {
  const { assetSearchQuery, setAssetSearchQuery } = useEditorStore()

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAssetSearchQuery(e.target.value)
  }

  return (
    <div className="px-4 pb-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <IoSearch className="text-slate-400" size={16} />
        </div>
        <input
          type="text"
          value={assetSearchQuery}
          onChange={handleSearchChange}
          placeholder="ex) Rotation, TypeWriter, Glitch"
          className="w-full pl-10 pr-3 py-2 text-sm bg-slate-700/90 border border-slate-500/70 rounded-md text-white placeholder-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-colors duration-200"
        />
      </div>
    </div>
  )
}

export default SearchBar
