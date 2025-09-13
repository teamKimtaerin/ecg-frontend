'use client'

import Tab from '@/components/ui/Tab'
import TabItem from '@/components/ui/TabItem'
import DocumentModal from '@/components/ui/DocumentModal'
import DeployModal from '@/components/ui/DeployModal'
import UserDropdown from '@/components/ui/UserDropdown'
import ToolbarToggle from './ToolbarToggle'
import EditingModeToggle from './EditingModeToggle'
import { useEditorStore } from '../store'
import { EDITOR_TABS } from '../types'
import { useEffect, useState, useRef } from 'react'
import { AutosaveManager } from '@/utils/managers/AutosaveManager'
import { LuMenu, LuShoppingBag, LuHouse } from 'react-icons/lu'
import { useDeployModal } from '@/hooks/useDeployModal'

export interface EditorHeaderTabsProps {
  activeTab?: string
  onTabChange?: (tabId: string) => void
  isToolbarVisible?: boolean
  onToolbarToggle?: () => void
  onShowToolbar?: () => void
}

const TAB_LABELS: Record<string, string> = {
  home: '홈',
  edit: '편집',
  format: '서식',
  insert: '삽입',
  template: '템플릿',
}

export default function EditorHeaderTabs({
  activeTab: propsActiveTab,
  onTabChange: propsOnTabChange,
  isToolbarVisible = true,
  onToolbarToggle,
  onShowToolbar,
}: EditorHeaderTabsProps = {}) {
  // Use store values as defaults, but allow prop overrides
  const store = useEditorStore()
  const { editingMode } = store
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const [projectType, setProjectType] = useState<
    'browser' | 'device' | 'cloud'
  >('browser')

  // Navigation dropdown state
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false)
  const navButtonRef = useRef<HTMLButtonElement>(null)

  // Document modal state
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false)
  const documentButtonRef = useRef<HTMLButtonElement>(null)

  // Deploy modal hook
  const { openDeployModal, deployModalProps } = useDeployModal()

  const handleDeployClick = (task: { id: number; filename: string }) => {
    openDeployModal({
      id: task.id,
      filename: task.filename,
    })
  }

  // Mock data for document modal
  const exportTasks = [
    {
      id: 1,
      filename: 'video_project_1.mp4',
      progress: 75,
      status: 'processing' as const,
    },
    {
      id: 2,
      filename: 'video_project_2.mp4',
      progress: 100,
      status: 'completed' as const,
      completedAt: '2025-01-11 14:30',
    },
    {
      id: 3,
      filename: 'video_project_3.mp4',
      progress: 100,
      status: 'completed' as const,
      completedAt: '2025-01-11 12:15',
    },
  ]

  const uploadTasks = [
    {
      id: 1,
      filename: 'video_raw_1.mp4',
      progress: 45,
      status: 'uploading' as const,
    },
    {
      id: 2,
      filename: 'video_raw_2.mp4',
      progress: 100,
      status: 'completed' as const,
      completedAt: '2025-01-11 13:45',
    },
    {
      id: 3,
      filename: 'video_raw_3.mp4',
      progress: 0,
      status: 'failed' as const,
      completedAt: '2025-01-11 11:20',
    },
  ]

  // If props are provided, use them; otherwise fall back to store
  const activeTab =
    propsActiveTab !== undefined ? propsActiveTab : store.activeTab

  const handleTabChange = (tabId: string) => {
    // Show toolbar if it's hidden when tab is changed
    if (!isToolbarVisible && onShowToolbar) {
      onShowToolbar()
    }

    // Call the original tab change handler
    if (propsOnTabChange) {
      propsOnTabChange(tabId)
    } else {
      store.setActiveTab(tabId as never)
    }
  }

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

  // Close navigation dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element

      // 드롭다운 내부 클릭은 무시
      if (target.closest('.nav-dropdown')) {
        return
      }

      if (
        navButtonRef.current &&
        !navButtonRef.current.contains(event.target as Node) &&
        isNavDropdownOpen
      ) {
        setIsNavDropdownOpen(false)
      }
    }

    if (isNavDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isNavDropdownOpen])

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
    <div className="bg-gray-100 border-b border-gray-300 shadow-sm relative">
      <div className="flex items-center px-6 py-1">
        {/* Left Side - Navigation Menu */}
        <div className="relative mr-4">
          <button
            ref={navButtonRef}
            onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-all duration-200 cursor-pointer"
            title="메뉴"
          >
            <LuMenu className="w-5 h-5" />
          </button>

          {/* Navigation Dropdown */}
          {isNavDropdownOpen && (
            <div className="nav-dropdown absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] min-w-[150px]">
              <button
                onClick={() => (window.location.href = '/')}
                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg transition-colors cursor-pointer"
              >
                <LuHouse className="w-4 h-4 mr-3" />
                메인 페이지
              </button>
              <button
                onClick={() => (window.location.href = '/asset-store')}
                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg transition-colors cursor-pointer"
              >
                <LuShoppingBag className="w-4 h-4 mr-3" />
                에셋 스토어
              </button>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative">
          <UserDropdown />
        </div>

        {/* Center - Tab Navigation */}
        <div className="flex-1 mx-6">
          {editingMode === 'advanced' ? (
            <Tab
              selectedItem={activeTab}
              onSelectionChange={handleTabChange}
              size="small"
              isQuiet={true}
            >
              {EDITOR_TABS.map((tab) => (
                <TabItem key={tab} id={tab} label={TAB_LABELS[tab]} />
              ))}
            </Tab>
          ) : (
            // 쉬운 편집 모드에서는 탭 없음
            <div />
          )}
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-4 mr-4">
          {/* Save Status Indicator */}
          <div className="flex items-center gap-2 text-xs text-gray-700">
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
              <span className="text-gray-600">
                (
                {new Date(lastSaveTime).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                )
              </span>
            )}
          </div>

          {/* Document Modal */}
          <div className="relative">
            <button
              ref={documentButtonRef}
              onClick={() => setIsDocumentModalOpen(!isDocumentModalOpen)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 hover:scale-110 hover:shadow-md rounded-lg transition-all duration-200 cursor-pointer"
              title="문서함"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm16 0V6a2 2 0 00-2-2H7a2 2 0 00-2 2v1m14 0H3"
                />
              </svg>
            </button>

            <DocumentModal
              isOpen={isDocumentModalOpen}
              onClose={() => setIsDocumentModalOpen(false)}
              buttonRef={documentButtonRef}
              exportTasks={exportTasks}
              uploadTasks={uploadTasks}
              onDeployClick={handleDeployClick}
            />
          </div>

          {/* Editing Mode Toggle */}
          <EditingModeToggle />

          {/* Toolbar Toggle */}
          {onToolbarToggle && (
            <ToolbarToggle
              isToolbarVisible={isToolbarVisible}
              onToggle={onToolbarToggle}
            />
          )}
        </div>
      </div>

      {/* Deploy Modal - Separate from DocumentModal */}
      <DeployModal {...deployModalProps} />
    </div>
  )
}
