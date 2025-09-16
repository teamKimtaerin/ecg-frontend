'use client'

import Tab from '@/components/ui/Tab'
import TabItem from '@/components/ui/TabItem'
import { useEditorStore } from '../store'
import { EDITOR_TABS } from '../types'
import { useEffect, useState } from 'react'
import { AutosaveManager } from '@/utils/managers/AutosaveManager'

export interface EditorHeaderTabsProps {
  activeTab?: string
  onTabChange?: (tabId: string) => void
}

const TAB_LABELS: Record<string, string> = {
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
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const [projectType, setProjectType] = useState<
    'browser' | 'device' | 'cloud'
  >('browser')

  // If props are provided, use them; otherwise fall back to store
  const activeTab =
    propsActiveTab !== undefined ? propsActiveTab : store.activeTab
  const handleTabChange =
    propsOnTabChange || ((tabId: string) => store.setActiveTab(tabId as never))

  // Subscribe to autosave status
  useEffect(() => {
    const autosaveManager = AutosaveManager.getInstance()

    const unsubscribe = autosaveManager.onStatusChange((status) => {
      setSaveStatus(status)
      if (status === 'saved') {
        setLastSaveTime(autosaveManager.getLastSaveTime())
      }
    })

    // Get initial values
    setSaveStatus(autosaveManager.getSaveStatus())
    setProjectType(autosaveManager.getProjectType())
    setLastSaveTime(autosaveManager.getLastSaveTime())

    return unsubscribe
  }, [])

  const getSaveStatusText = () => {
    switch (projectType) {
      case 'browser':
        return '현재 기기에 저장됨'
      case 'device':
        return '로컬에 저장됨'
      case 'cloud':
        return '클라우드에 저장됨'
    }
  }

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

        {/* Save Status Indicator */}
        <div className="flex items-center gap-2 ml-4 text-xs text-slate-400">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1">
              <span className="text-yellow-400">●</span>
              저장 중...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1">
              <span className="text-green-400">✓</span>
              {getSaveStatusText()}
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1">
              <span className="text-red-400">⚠</span>
              저장 실패
            </span>
          )}
          {lastSaveTime && saveStatus === 'saved' && (
            <span className="text-slate-500">
              (
              {new Date(lastSaveTime).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              )
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
