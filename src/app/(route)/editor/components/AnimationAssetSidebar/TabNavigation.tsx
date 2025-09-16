'use client'

import React from 'react'
import { useEditorStore } from '../../store'

const TabNavigation: React.FC = () => {
  const { activeAssetTab, setActiveAssetTab } = useEditorStore()

  const tabs = [
    { id: 'my' as const, label: '담은 에셋' },
    { id: 'free' as const, label: '담지 않은 에셋' },
  ]

  return (
    <div className="px-4 pb-4">
      <div className="flex rounded-lg bg-slate-800/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveAssetTab(tab.id)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeAssetTab === tab.id
                ? 'bg-slate-600/80 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default TabNavigation
