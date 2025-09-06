'use client'

import React from 'react'
import Button from '@/components/ui/Button'
import Tab from '@/components/ui/Tab'
import TabItem from '@/components/ui/TabItem'

export interface EditorHeaderTabsProps {
  activeTab: string
  onTabChange: (tabId: string) => void
}

function EditorHeaderTabs({ activeTab, onTabChange }: EditorHeaderTabsProps) {
  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-600/40 relative">
      <div className="flex items-center px-6 py-2">
        <Tab
          selectedItem={activeTab}
          onSelectionChange={onTabChange}
          size="small"
          isQuiet={true}
          className="flex-1"
        >
          <TabItem id="file" label="파일" />
          <TabItem id="home" label="홈" />
          <TabItem id="edit" label="편집" />
          <TabItem id="subtitle" label="자막" />
          <TabItem id="format" label="서식" />
          <TabItem id="insert" label="삽입" />
          <TabItem id="template" label="템플릿" />
          <TabItem id="effect" label="효과" />
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

export default EditorHeaderTabs
