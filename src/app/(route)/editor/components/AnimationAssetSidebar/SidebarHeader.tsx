'use client'

import React from 'react'
import { IoClose } from 'react-icons/io5'
import { useEditorStore } from '../../store'

const SidebarHeader: React.FC = () => {
  const { setIsAssetSidebarOpen } = useEditorStore()

  const handleClose = () => {
    setIsAssetSidebarOpen(false)
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-600/40">
      <h2 className="text-lg font-semibold text-white">애니메이션 에셋</h2>
      <button
        onClick={handleClose}
        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors duration-200"
        aria-label="사이드바 닫기"
      >
        <IoClose size={20} />
      </button>
    </div>
  )
}

export default SidebarHeader
