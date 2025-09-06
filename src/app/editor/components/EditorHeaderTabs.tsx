'use client'

import React from 'react'
import Button from '@/components/ui/Button'
import Tab from '@/components/ui/Tab'
import TabItem from '@/components/ui/TabItem'
import { useEditorStore } from '../store'
import { EDITOR_TABS } from '../types'

export interface EditorHeaderTabsProps {
  activeTab?: string
  onTabChange?: (tabId: string) => void
}

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

export default function EditorHeaderTabs({
  activeTab: propsActiveTab,
  onTabChange: propsOnTabChange,
}: EditorHeaderTabsProps = {}) {
  // Use store values as defaults, but allow prop overrides
  const store = useEditorStore()

  // If props are provided, use them; otherwise fall back to store
  const activeTab =
    propsActiveTab !== undefined ? propsActiveTab : store.activeTab
  const handleTabChange =
    propsOnTabChange || ((tabId: string) => store.setActiveTab(tabId as never))

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-600/40 relative">
      <div className="flex items-center px-6 py-2">
        <Tab
          selectedItem={activeTab}
          onSelectionChange={handleTabChange}
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
