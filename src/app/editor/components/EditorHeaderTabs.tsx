'use client'

import React from 'react'
import Tab from '@/components/Tab'
import TabItem from '@/components/TabItem'
import Button from '@/components/Button'
import { useEditorStore } from '../store'
import { EDITOR_TABS } from '../types'

const TAB_LABELS: Record<string, string> = {
  file: '파일',
  home: '홈',
  edit: '편집',
  subtitle: '자막',
  format: '서식',
  insert: '삽입',
  template: '템플릿',
  effect: '효과',
}

export default function EditorHeaderTabs() {
  const { activeTab, setActiveTab } = useEditorStore()

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-600/40 relative">
      <div className="flex items-center px-6 py-2">
        <Tab
          selectedItem={activeTab}
          onSelectionChange={(tabId) => setActiveTab(tabId as never)}
          size="small"
          isQuiet={true}
          className="flex-1"
        >
          {EDITOR_TABS.map((tab) => (
            <TabItem key={tab} id={tab} label={TAB_LABELS[tab]} />
          ))}
        </Tab>

        <Button
          variant="accent"
          size="small"
          className="ml-4 px-3 py-1.5 text-xs bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm hover:shadow-md transition-all duration-200 hover:from-blue-600 hover:to-indigo-700"
        >
          내보내기
        </Button>
      </div>
    </div>
  )
}