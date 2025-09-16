'use client'

import {
  DndContext,
  closestCenter,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core'
import { useCallback, useEffect, useId, useState, useRef } from 'react'
import { createPortal } from 'react-dom'

// Store
import { useEditorStore } from './store'

// Storage & Managers
import { log } from '@/utils/logger'
import { AutosaveManager } from '@/utils/managers/AutosaveManager'
import { projectInfoManager } from '@/utils/managers/ProjectInfoManager'
import { mediaStorage } from '@/utils/storage/mediaStorage'
import { projectStorage } from '@/utils/storage/projectStorage'

// API Services
import { API_CONFIG } from '@/config/api.config'
import { transcriptionService } from '@/services/api/transcriptionService'

// Types
import { ClipItem } from './components/ClipComponent/types'
import { EditorTab } from './types'

// Hooks
import { useUploadModal } from '@/hooks/useUploadModal'
import { useDragAndDrop } from './hooks/useDragAndDrop'
import { useSelectionBox } from './hooks/useSelectionBox'
import { useUnsavedChanges } from './hooks/useUnsavedChanges'
import { useGlobalWordDragAndDrop } from './hooks/useGlobalWordDragAndDrop'

// Components
import SelectionBox from '@/components/DragDrop/SelectionBox'
import NewUploadModal from '@/components/NewUploadModal'
import TutorialModal from '@/components/TutorialModal'
import { ChevronDownIcon } from '@/components/icons'
import AlertDialog from '@/components/ui/AlertDialog'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ResizablePanelDivider from '@/components/ui/ResizablePanelDivider'
import { getSpeakerColor } from '@/utils/editor/speakerColors'
import AnimationAssetSidebar from './components/AnimationAssetSidebar'
import EditorHeaderTabs from './components/EditorHeaderTabs'
import SimpleToolbar from './components/SimpleToolbar'
import SpeakerManagementSidebar from './components/SpeakerManagementSidebar'
import SubtitleEditList from './components/SubtitleEditList'
import TemplateSidebar from './components/TemplateSidebar'
import Toolbars from './components/Toolbars'
import VideoSection from './components/VideoSection'
import { normalizeClipOrder } from '@/utils/editor/clipTimelineUtils'

// Utils
import { EditorHistory } from '@/utils/editor/EditorHistory'
import { areClipsConsecutive } from '@/utils/editor/clipMerger'
import { BatchChangeSpeakerCommand } from '@/utils/editor/commands/BatchChangeSpeakerCommand'
import { ChangeSpeakerCommand } from '@/utils/editor/commands/ChangeSpeakerCommand'
import { CopyClipsCommand } from '@/utils/editor/commands/CopyClipsCommand'
import { DeleteClipCommand } from '@/utils/editor/commands/DeleteClipCommand'
import { MergeClipsCommand } from '@/utils/editor/commands/MergeClipsCommand'
import { PasteClipsCommand } from '@/utils/editor/commands/PasteClipsCommand'
import { RemoveSpeakerCommand } from '@/utils/editor/commands/RemoveSpeakerCommand'
import { SplitClipCommand } from '@/utils/editor/commands/SplitClipCommand'
import { showToast } from '@/utils/ui/toast'

// TimelineClipCard 컴포넌트
interface TimelineClipCardProps {
  clip: ClipItem
  isActive: boolean
  startTime: number
  endTime: number
  speakers: string[]
  speakerColors: Record<string, string>
  onClipSelect: (clipId: string) => void
  onSpeakerChange: (clipId: string, newSpeaker: string) => void
  onAddSpeaker: (name: string) => void
  onRenameSpeaker: (oldName: string, newName: string) => void
  onOpenSpeakerManagement: () => void
  formatTime: (seconds: number) => string
}

function TimelineClipCard({
  clip,
  isActive,
  startTime,
  endTime,
  speakers,
  speakerColors,
  onClipSelect,
  onSpeakerChange,
  onAddSpeaker,
  onRenameSpeaker,
  onOpenSpeakerManagement,
  formatTime,
}: TimelineClipCardProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [pendingRename, setPendingRename] = useState<{
    oldName: string
    newName: string
  } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return
      }

      const portalDropdown = document.querySelector('.fixed.rounded.bg-white')
      if (portalDropdown && portalDropdown.contains(target)) {
        return
      }

      setIsDropdownOpen(false)
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const handleSpeakerSelect = (value: string) => {
    if (value === 'add_new') {
      const nextSpeakerNumber = speakers.length + 1
      const newSpeakerName = `화자${nextSpeakerNumber}`
      onAddSpeaker(newSpeakerName)
      onSpeakerChange(clip.id, newSpeakerName)
      setIsDropdownOpen(false)
    } else if (value === 'manage_speakers') {
      onOpenSpeakerManagement()
      setIsDropdownOpen(false)
    } else if (value.startsWith('edit_')) {
      const speakerToEdit = value.replace('edit_', '')
      setEditingSpeaker(speakerToEdit)
      setEditingName(speakerToEdit)
      setIsDropdownOpen(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      onSpeakerChange(clip.id, value)
      setIsDropdownOpen(false)
    }
  }

  const handleSaveEdit = () => {
    if (!editingName.trim() || !editingSpeaker) {
      handleCancelEdit()
      return
    }

    const trimmedName = editingName.trim()

    if (trimmedName === editingSpeaker) {
      setEditingSpeaker(null)
      setEditingName('')
      return
    }

    if (speakers.includes(trimmedName) && trimmedName !== editingSpeaker) {
      showToast('이미 존재하는 화자명입니다', 'error')
      setEditingName(editingSpeaker)
      return
    }

    setPendingRename({ oldName: editingSpeaker, newName: trimmedName })
    setShowRenameModal(true)
    setEditingSpeaker(null)
    setEditingName('')
  }

  const handleRenameChoice = (applyToAll: boolean) => {
    if (!pendingRename) return

    if (applyToAll) {
      onRenameSpeaker(pendingRename.oldName, pendingRename.newName)
    } else {
      onAddSpeaker(pendingRename.newName)
      onSpeakerChange(clip.id, pendingRename.newName)
    }

    setShowRenameModal(false)
    setPendingRename(null)
    setEditingSpeaker(null)
    setEditingName('')
  }

  const handleCancelEdit = () => {
    setEditingSpeaker(null)
    setEditingName('')
    if (inputRef.current) {
      inputRef.current.blur()
    }
  }

  return (
    <>
      <div
        className={`p-3 rounded-lg cursor-pointer transition-all border ${
          isActive
            ? 'bg-blue-50 border-blue-200 shadow-md'
            : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
        }`}
        onClick={() => onClipSelect(clip.id)}
      >
        {/* 시간 정보 */}
        <div className="mb-3">
          <span className="text-xs text-gray-500">
            {formatTime(startTime)} - {formatTime(endTime)}
          </span>
        </div>

        {/* 메인 콘텐츠 - 고급 편집 페이지와 동일한 그리드 레이아웃 */}
        <div className="grid grid-cols-[160px_1fr] gap-3 items-start">
          {/* 화자 영역 */}
          <div className="flex items-center h-8">
            {editingSpeaker ? (
              <div
                className="relative flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === 'Enter') handleSaveEdit()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                  onBlur={() => setTimeout(() => handleSaveEdit(), 100)}
                  placeholder="화자 이름 입력"
                  className="h-8 px-3 text-sm bg-white text-black border border-gray-300 rounded
                            focus:outline-none focus:ring-2 focus:border-transparent 
                            w-[120px] flex-shrink-0 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div
                ref={dropdownRef}
                className="relative flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="inline-flex items-center justify-between h-8 px-3 text-sm font-medium
                             bg-transparent text-black border border-gray-300 rounded
                             hover:bg-gray-50 hover:border-gray-400 transition-all
                             focus:outline-none focus:ring-2 focus:ring-blue-500
                             w-[120px] flex-shrink-0 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDropdownOpen(!isDropdownOpen)
                  }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: getSpeakerColor(
                          clip.speaker,
                          speakerColors
                        ),
                      }}
                    />
                    <span
                      className={`truncate overflow-hidden whitespace-nowrap ${!clip.speaker ? 'text-orange-500' : ''}`}
                      style={{ maxWidth: '70px' }}
                    >
                      {clip.speaker || '미지정'}
                    </span>
                  </div>
                  <ChevronDownIcon
                    className={`w-4 h-4 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* 드롭다운 메뉴 */}
                {isDropdownOpen &&
                  typeof window !== 'undefined' &&
                  createPortal(
                    <div
                      className="fixed rounded bg-white border border-gray-300 shadow-lg"
                      style={{
                        zIndex: 99999,
                        left:
                          dropdownRef.current?.getBoundingClientRect().left ||
                          0,
                        top:
                          (dropdownRef.current?.getBoundingClientRect()
                            .bottom || 0) + 4,
                        width: '120px',
                        minWidth: '120px',
                        maxWidth: '120px',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {speakers.map((s) => (
                        <div key={s} className="group">
                          <div
                            className="px-3 py-2 text-sm text-black hover:bg-gray-50 cursor-pointer
                                  transition-colors flex items-center justify-between"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleSpeakerSelect(s)
                            }}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor: getSpeakerColor(
                                    s,
                                    speakerColors
                                  ),
                                }}
                              />
                              <span
                                className={`truncate overflow-hidden whitespace-nowrap ${clip.speaker === s ? 'text-blue-600 font-medium' : ''}`}
                                style={{ maxWidth: '50px' }}
                              >
                                {s}
                              </span>
                            </div>
                            <button
                              className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-black
                                    text-xs px-1 py-0.5 rounded transition-all flex-shrink-0 cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleSpeakerSelect(`edit_${s}`)
                              }}
                            >
                              편집
                            </button>
                          </div>
                        </div>
                      ))}

                      <div className="border-t border-gray-200 my-1" />

                      <div
                        className="px-3 py-2 text-sm text-blue-600 hover:bg-gray-50 cursor-pointer
                              transition-colors font-medium"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleSpeakerSelect('add_new')
                        }}
                      >
                        + 화자 추가하기
                      </div>

                      <div
                        className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-800 cursor-pointer
                              transition-colors font-medium flex items-center gap-2"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleSpeakerSelect('manage_speakers')
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        화자 관리
                      </div>
                    </div>,
                    document.body
                  )}
              </div>
            )}
          </div>

          {/* 텍스트 영역 */}
          <div className="overflow-hidden min-w-0 min-h-[32px] flex items-center">
            <div
              className={`text-sm ${isActive ? 'font-medium text-gray-900' : 'text-gray-700'}`}
            >
              {clip.fullText}
            </div>
          </div>
        </div>
      </div>

      {/* 화자 이름 변경 적용 범위 확인 모달 */}
      {showRenameModal &&
        pendingRename &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center"
            style={{ zIndex: 99999 }}
          >
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                화자 이름 변경 적용 범위
              </h3>
              <div className="text-gray-300 mb-6 space-y-2">
                <p>
                  &quot;{pendingRename.oldName}&quot;을 &quot;
                  {pendingRename.newName}&quot;로 변경합니다.
                </p>
                <p className="text-sm text-gray-400">
                  이 화자를 사용하는 다른 클립에도 변경사항을 적용하시겠습니까?
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => handleRenameChoice(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded
                          hover:bg-gray-600 transition-colors cursor-pointer"
                >
                  아니오 (현재 클립만)
                </button>
                <button
                  onClick={() => handleRenameChoice(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded
                          hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  예 (모든 클립)
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

export default function EditorPage() {
  // Store state for DnD and selection
  const {
    clips,
    setClips,
    setOriginalClips,
    restoreOriginalClips,
    saveOriginalClipsToStorage,
    loadOriginalClipsFromStorage,
    selectedClipIds,
    setSelectedClipIds,
    clearSelection,
    updateClipWords,
    updateClipTiming,
    saveProject,
    activeClipId,
    setActiveClipId,
    videoPanelWidth,
    setVideoPanelWidth,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    markAsSaved,
    rightSidebarType,
    setRightSidebarType,
    // isAssetSidebarOpen,
    assetSidebarWidth,
    setAssetSidebarWidth,
    editingMode,
  } = useEditorStore()

  // Local state
  const [activeTab, setActiveTab] = useState<EditorTab>('home')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [showTutorialModal, setShowTutorialModal] = useState(false)
  const [isToolbarVisible, setIsToolbarVisible] = useState(true)
  const [editorHistory] = useState(() => {
    const history = new EditorHistory()
    // Connect history to save state
    history.setOnChangeCallback((hasChanges) => {
      setHasUnsavedChanges(hasChanges)
    })
    return history
  })
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1920
  )
  const [isRecovering, setIsRecovering] = useState(false) // 세션 복구 스피너 비활성화
  const [scrollProgress, setScrollProgress] = useState(0) // 스크롤 진행도
  const [speakers, setSpeakers] = useState<string[]>([]) // Speaker 리스트 전역 관리
  const [speakerColors, setSpeakerColors] = useState<Record<string, string>>({}) // 화자별 색상 매핑
  // Store에서 rightSidebarType 가져오기 (로컬 state 대신 store 사용)
  const [clipboard, setClipboard] = useState<ClipItem[]>([]) // 클립보드 상태
  const [skipAutoFocus, setSkipAutoFocus] = useState(false) // 자동 포커스 스킵 플래그
  const [showRestoreModal, setShowRestoreModal] = useState(false) // 복원 확인 모달 상태
  const [shouldOpenExportModal, setShouldOpenExportModal] = useState(false) // OAuth 인증 후 모달 재오픈 플래그

  // Get media actions from store
  const { setMediaInfo } = useEditorStore()

  // Track unsaved changes
  useUnsavedChanges(hasUnsavedChanges)

  // URL 파라미터 감지 및 모달 상태 복원
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const authStatus = urlParams.get('auth')
      const returnTo = urlParams.get('returnTo')

      // OAuth 인증 완료 후 YouTube 업로드 모달로 복귀
      if (authStatus === 'success' && returnTo === 'youtube-upload') {
        console.log('OAuth 인증 완료, YouTube 업로드 모달 재오픈 예정')
        setShouldOpenExportModal(true)

        // URL 파라미터 제거
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [])

  // Session recovery and initialization
  useEffect(() => {
    const initializeEditor = async () => {
      try {
        log('EditorPage.tsx', 'Initializing editor...')

        // Initialize AutosaveManager
        const autosaveManager = AutosaveManager.getInstance()

        // Load transcription data using the TranscriptionService
        // This provides an extensible interface for switching between mock and API data
        const transcriptionClips =
          await transcriptionService.loadTranscriptionClips()
        if (transcriptionClips.length > 0) {
          log(
            'EditorPage.tsx',
            `Loaded ${transcriptionClips.length} clips via TranscriptionService`
          )

          // Extract unique speakers from clips and rename them with numbers
          const originalSpeakers = Array.from(
            new Set(transcriptionClips.map((clip) => clip.speaker))
          )

          // Create mapping for speaker names (original -> numbered)
          const speakerMapping: Record<string, string> = {}
          originalSpeakers.forEach((speaker, index) => {
            speakerMapping[speaker] = `화자${index + 1}`
          })

          // Update clips with new speaker names (only change speaker field, preserve all text)
          const updatedClips = transcriptionClips.map((clip) => ({
            ...clip,
            speaker: speakerMapping[clip.speaker] || clip.speaker,
          }))

          const numberedSpeakers = Object.values(speakerMapping)

          setClips(updatedClips)
          setOriginalClips(updatedClips) // 메모리에 원본 클립 데이터 저장
          setSpeakers(numberedSpeakers)

          // IndexedDB에도 원본 클립 저장 (세션 간 유지)
          saveOriginalClipsToStorage().catch((error) => {
            console.error('Failed to save original clips to IndexedDB:', error)
          })

          // Set media info when in mock mode
          if (API_CONFIG.USE_MOCK_DATA) {
            setMediaInfo({
              videoUrl: API_CONFIG.MOCK_VIDEO_PATH,
              videoName: 'friends.mp4',
              videoType: 'video/mp4',
              videoDuration: 143.39,
            })
          }
        } else {
          log(
            'EditorPage.tsx',
            'Failed to load transcription data from service'
          )
        }

        // Check for project to recover
        const projectId = sessionStorage.getItem('currentProjectId')
        const mediaId = sessionStorage.getItem('currentMediaId')

        if (projectId || mediaId) {
          log(
            'EditorPage.tsx',
            `Found session data - projectId: ${projectId}, mediaId: ${mediaId}`
          )

          try {
            // Load project media info
            if (projectId) {
              const projectMediaInfo =
                await mediaStorage.loadProjectMedia(projectId)
              if (projectMediaInfo) {
                log(
                  'EditorPage.tsx',
                  `Loaded project media info: ${projectMediaInfo.fileName}`
                )

                // Set media info in store
                setMediaInfo({
                  mediaId: projectMediaInfo.mediaId,
                  videoName: projectMediaInfo.fileName,
                  videoType: projectMediaInfo.fileType,
                  videoDuration: projectMediaInfo.duration,
                  videoMetadata: projectMediaInfo.metadata,
                })

                // Notify ProjectInfoManager
                projectInfoManager.notifyFileOpen('browser', 'recovery', {
                  id: projectId,
                  name: projectMediaInfo.fileName.replace(/\.[^/.]+$/, ''), // Remove extension
                })

                // Set project in AutosaveManager
                autosaveManager.setProject(projectId, 'browser')
              }
            }

            // Load saved project data
            const savedProject = projectStorage.loadCurrentProject()
            if (
              savedProject &&
              savedProject.clips &&
              savedProject.clips.length > 0
            ) {
              log('EditorPage.tsx', `Recovered project: ${savedProject.name}`)
              // 프로젝트 복구 시 클립 순서를 실제 타임라인 순서로 정규화
              const normalizedClips = normalizeClipOrder(savedProject.clips)
              setClips(normalizedClips)

              // 프로젝트 복구 시 IndexedDB에서 원본 클립 로드 시도
              if (projectId) {
                loadOriginalClipsFromStorage().catch((error) => {
                  console.warn(
                    'Failed to load original clips from storage:',
                    error
                  )
                  // 실패해도 프로젝트 복구는 계속 진행
                })
              }

              // Restore media information if available
              if (savedProject.mediaId || savedProject.videoUrl) {
                setMediaInfo({
                  mediaId: savedProject.mediaId || null,
                  videoUrl: savedProject.videoUrl || null,
                  videoName: savedProject.videoName || null,
                  videoType: savedProject.videoType || null,
                  videoDuration: savedProject.videoDuration || null,
                  videoMetadata: savedProject.videoMetadata || null,
                })
              }

              // Set project in AutosaveManager
              autosaveManager.setProject(savedProject.id, 'browser')

              // Show recovery notification
              showToast('이전 세션이 복구되었습니다', 'success')
            }
          } catch (error) {
            console.error('Failed to recover session:', error)
            showToast('세션 복구에 실패했습니다', 'error')
          }
        } else {
          // No session to recover - check for autosaved project
          const currentProject = projectStorage.loadCurrentProject()
          if (
            currentProject &&
            currentProject.clips &&
            currentProject.clips.length > 0
          ) {
            log(
              'EditorPage.tsx',
              `Found autosaved project: ${currentProject.name}`
            )
            // 기존 프로젝트 로드 시에도 클립 순서를 실제 타임라인 순서로 정규화
            const normalizedClips = normalizeClipOrder(currentProject.clips)
            setClips(normalizedClips)
            autosaveManager.setProject(currentProject.id, 'browser')
          } else {
            // New project
            const newProjectId = `project_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
            log('EditorPage.tsx', `Creating new project: ${newProjectId}`)
            autosaveManager.setProject(newProjectId, 'browser')
            projectInfoManager.notifyFileOpen('browser', 'newProject')
          }
        }

        // Clear session storage after recovery
        sessionStorage.removeItem('currentProjectId')
        sessionStorage.removeItem('currentMediaId')
      } catch (error) {
        console.error('Failed to initialize editor:', error)
        showToast('에디터 초기화에 실패했습니다', 'error')
      } finally {
        // Always set recovering to false
        setIsRecovering(false)
      }
    }

    initializeEditor()
  }, [
    setClips,
    setOriginalClips,
    setMediaInfo,
    saveOriginalClipsToStorage,
    loadOriginalClipsFromStorage,
  ])

  // Generate stable ID for DndContext to prevent hydration mismatch
  const dndContextId = useId()

  // Upload modal hook
  const { isTranscriptionLoading, handleFileSelect } = useUploadModal()

  // DnD functionality
  const {
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useDragAndDrop()

  // Word drag and drop functionality (cross-clip support)
  const {
    handleWordDragStart,
    handleWordDragOver,
    handleWordDragEnd,
    handleWordDragCancel,
  } = useGlobalWordDragAndDrop()

  // Selection box functionality
  const {
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isSelecting,
    selectionBox,
  } = useSelectionBox()

  // Scroll progress handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const scrollTop = element.scrollTop
    const scrollHeight = element.scrollHeight - element.clientHeight
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
    setScrollProgress(progress)
  }, [])

  // Panel resize handler
  const handlePanelResize = useCallback(
    (delta: number) => {
      const newWidth = videoPanelWidth + delta
      const minWidth = 300 // Minimum width
      const maxWidth = windowWidth / 2 // Maximum 50% of viewport

      // Constrain the width between min and max
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
      setVideoPanelWidth(constrainedWidth)

      // Save to localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'editor-video-panel-width',
          constrainedWidth.toString()
        )
      }
    },
    [videoPanelWidth, windowWidth, setVideoPanelWidth]
  )

  // Asset sidebar resize handler
  const handleAssetSidebarResize = useCallback(
    (delta: number) => {
      const newWidth = assetSidebarWidth - delta // Reverse delta for right sidebar
      const minWidth = 280 // Minimum width
      const maxWidth = windowWidth / 2 // Maximum 50% of viewport

      // Constrain the width between min and max
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
      setAssetSidebarWidth(constrainedWidth)

      // Save to localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'editor-asset-sidebar-width',
          constrainedWidth.toString()
        )
      }
    },
    [assetSidebarWidth, windowWidth, setAssetSidebarWidth]
  )

  // Edit handlers
  const handleWordEdit = (clipId: string, wordId: string, newText: string) => {
    updateClipWords(clipId, wordId, newText)
  }

  const handleSpeakerChange = (clipId: string, newSpeaker: string) => {
    // Use Command pattern for undo/redo support
    const command = new ChangeSpeakerCommand(
      clips,
      speakers,
      clipId,
      newSpeaker,
      setClips,
      setSpeakers
    )
    editorHistory.executeCommand(command)
  }

  const handleBatchSpeakerChange = (clipIds: string[], newSpeaker: string) => {
    // If only one clipId is passed, check if we should apply to all empty clips
    let targetClipIds = clipIds

    if (clipIds.length === 1) {
      // Check if the current clip is empty and find all empty clips
      const currentClip = clips.find((c) => c.id === clipIds[0])
      if (currentClip && !currentClip.speaker) {
        // Find all clips without speakers
        const emptyClipIds = clips
          .filter((clip) => !clip.speaker)
          .map((clip) => clip.id)

        // If there are multiple empty clips, we'll apply to all of them
        if (emptyClipIds.length > 1) {
          targetClipIds = emptyClipIds
        }
      }
    }

    // Use Command pattern for batch speaker change
    const command = new BatchChangeSpeakerCommand(
      clips,
      speakers,
      targetClipIds,
      newSpeaker,
      setClips,
      setSpeakers
    )
    editorHistory.executeCommand(command)
  }

  // 오른쪽 사이드바 핸들러들
  const handleOpenSpeakerManagement = () => {
    setRightSidebarType(rightSidebarType === 'speaker' ? null : 'speaker')
  }

  // const handleOpenAnimationSidebar = () => {
  //   setRightSidebarType('animation')
  // }

  const handleToggleAnimationSidebar = () => {
    setRightSidebarType(rightSidebarType === 'animation' ? null : 'animation')
  }

  const handleToggleTemplateSidebar = () => {
    setRightSidebarType(rightSidebarType === 'template' ? null : 'template')
  }

  const handleCloseSidebar = () => {
    setRightSidebarType(null)
  }

  const handleAddSpeaker = (name: string) => {
    console.log('handleAddSpeaker called with:', name)
    console.log('Current speakers before adding:', speakers)

    // 최대 화자 수 제한 체크 (9명)
    if (speakers.length >= 9) {
      console.log('Maximum speaker limit reached (9), cannot add more')
      return
    }

    if (!speakers.includes(name)) {
      const newSpeakers = [...speakers, name]
      setSpeakers(newSpeakers)
      console.log('Speaker added successfully. New speakers:', newSpeakers)
    } else {
      console.log('Speaker already exists, skipping addition')
    }
  }

  const handleRemoveSpeaker = (name: string) => {
    // Use Command pattern for speaker removal
    const command = new RemoveSpeakerCommand(
      clips,
      speakers,
      name,
      setClips,
      setSpeakers
    )
    editorHistory.executeCommand(command)

    // Remove speaker color mapping
    const updatedSpeakerColors = { ...speakerColors }
    delete updatedSpeakerColors[name]
    setSpeakerColors(updatedSpeakerColors)
  }

  const handleRenameSpeaker = (oldName: string, newName: string) => {
    // Update clips with the new speaker name
    const updatedClips = clips.map((clip) =>
      clip.speaker === oldName ? { ...clip, speaker: newName } : clip
    )

    // Update speakers list
    const updatedSpeakers = speakers.map((speaker) =>
      speaker === oldName ? newName : speaker
    )

    // Update speaker colors mapping
    const updatedSpeakerColors = { ...speakerColors }
    if (updatedSpeakerColors[oldName]) {
      updatedSpeakerColors[newName] = updatedSpeakerColors[oldName]
      delete updatedSpeakerColors[oldName]
    }

    setClips(updatedClips)
    setSpeakers(updatedSpeakers)
    setSpeakerColors(updatedSpeakerColors)
  }

  const handleSpeakerColorChange = (speakerName: string, color: string) => {
    setSpeakerColors((prev) => ({
      ...prev,
      [speakerName]: color,
    }))
  }

  const handleClipCheck = (clipId: string, checked: boolean) => {
    if (checked) {
      const newSet = new Set(selectedClipIds)
      newSet.add(clipId)
      setSelectedClipIds(newSet)
      // 체크 시에는 포커싱을 변경하지 않음 (포커스와 선택을 분리)
    } else {
      const newSet = new Set(selectedClipIds)
      newSet.delete(clipId)
      setSelectedClipIds(newSet)
      // 체크 해제 시에도 포커싱 유지
    }
  }

  const handleClipSelect = (clipId: string) => {
    // 체크된 클립이 있으면 모든 선택 해제, 없으면 포커스만 변경
    if (selectedClipIds.size > 0) {
      clearSelection()
      setActiveClipId(null) // 선택 해제 시 포커스도 해제
    } else {
      setActiveClipId(clipId)

      // 선택된 클립의 시작 시간으로 비디오 이동
      const selectedClip = clips.find((c) => c.id === clipId)
      if (selectedClip && selectedClip.timeline) {
        // timeline 형식: "00:00 → 00:07"
        const [startTimeStr] = selectedClip.timeline.split(' → ')
        const [mins, secs] = startTimeStr.split(':').map(Number)
        const timeInSeconds = mins * 60 + secs

        // 비디오 플레이어로 시간 이동
        const videoPlayer = (
          window as { videoPlayer?: { seekTo: (time: number) => void } }
        ).videoPlayer
        if (videoPlayer) {
          videoPlayer.seekTo(timeInSeconds)
        }
      }
    }
  }

  // 빈 공간 클릭 시 모든 선택 해제
  const handleEmptySpaceClick = () => {
    if (selectedClipIds.size > 0) {
      clearSelection()
      setActiveClipId(null)
    }
  }

  // Upload modal handler - currently not used, placeholder for future implementation
  const wrappedHandleStartTranscription = async () => {
    // TODO: Implement actual file upload and transcription logic
    setIsUploadModalOpen(false)
    showToast('파일 업로드 기능은 준비 중입니다')
  }

  // Merge clips handler
  const handleMergeClips = useCallback(() => {
    try {
      // Get selected clips from store
      const uniqueSelectedIds = Array.from(selectedClipIds)

      // 체크된 클립이 있으면 기존 로직 사용 (2개 이상 선택된 경우)
      if (uniqueSelectedIds.length >= 2) {
        // 2개 이상의 클립이 선택된 경우 - 기존 로직
        if (!areClipsConsecutive(clips, uniqueSelectedIds)) {
          showToast(
            '선택된 클립들이 연속되어 있지 않습니다. 연속된 클립만 합칠 수 있습니다.'
          )
          return
        }

        // 클립 합치기 실행 - Command 패턴 사용
        const command = new MergeClipsCommand(
          clips,
          [],
          uniqueSelectedIds,
          setClips
        )

        editorHistory.executeCommand(command)
        clearSelection()

        // 자동 포커스 스킵 설정 및 합쳐진 클립에 포커스
        setSkipAutoFocus(true)
        setTimeout(() => {
          // Command에서 합쳐진 클립의 ID 가져오기
          const mergedClipId = command.getMergedClipId()
          if (mergedClipId) {
            setActiveClipId(mergedClipId)
            console.log(
              'Merge completed, focused on merged clip:',
              mergedClipId
            )
          }
        }, 100) // 상태 업데이트 완료 대기
        return
      }

      // 체크된 클립이 0~1개인 경우: 포커스된 클립과 다음 클립을 합치기
      if (!activeClipId) {
        showToast('합칠 클립을 선택해주세요.')
        return
      }

      // 포커스된 클립의 인덱스 찾기
      const currentIndex = clips.findIndex((clip) => clip.id === activeClipId)
      if (currentIndex === -1) {
        showToast('포커스된 클립을 찾을 수 없습니다.')
        return
      }

      // 다음 클립이 있는지 확인
      if (currentIndex >= clips.length - 1) {
        showToast('다음 클립이 존재하지 않습니다.')
        return
      }

      // 포커스된 클립과 다음 클립을 합치기
      const nextClipId = clips[currentIndex + 1].id
      const clipsToMerge = [activeClipId, nextClipId]
      const command = new MergeClipsCommand(clips, [], clipsToMerge, setClips)

      editorHistory.executeCommand(command)
      clearSelection()

      // 자동 포커스 스킵 설정 및 합쳐진 클립에 포커스
      setSkipAutoFocus(true)
      setTimeout(() => {
        // Command에서 합쳐진 클립의 ID 가져오기
        const mergedClipId = command.getMergedClipId()
        if (mergedClipId) {
          setActiveClipId(mergedClipId)
          console.log(
            'Single merge completed, focused on merged clip:',
            mergedClipId
          )
        }
      }, 100) // 상태 업데이트 완료 대기
    } catch (error) {
      console.error('클립 합치기 오류:', error)
      showToast(
        error instanceof Error
          ? error.message
          : '클립 합치기 중 오류가 발생했습니다.'
      )
    }
  }, [
    clips,
    selectedClipIds,
    activeClipId,
    clearSelection,
    setClips,
    editorHistory,
    setActiveClipId,
  ])

  // Split clip handler
  const handleSplitClip = useCallback(() => {
    try {
      if (!activeClipId) {
        showToast('나눌 클립을 선택해주세요.')
        return
      }

      // 포커싱된 클립 찾기
      const targetClip = clips.find((clip) => clip.id === activeClipId)
      if (!targetClip) {
        showToast('선택된 클립을 찾을 수 없습니다.')
        return
      }

      // 단어가 2개 이상인지 확인
      if (targetClip.words.length <= 1) {
        showToast('클립을 나누려면 단어가 2개 이상이어야 합니다.')
        return
      }

      // 클립 나누기 실행 - Command 패턴 사용
      const command = new SplitClipCommand(clips, activeClipId, setClips)
      editorHistory.executeCommand(command)

      // 자동 포커스 스킵 설정 및 분할된 첫 번째 클립에 포커스
      setSkipAutoFocus(true)
      setTimeout(() => {
        // SplitClipCommand에서 반환받은 첫 번째 분할 클립 ID로 포커스 설정
        const firstSplitClipId = command.getFirstSplitClipId()
        if (firstSplitClipId) {
          setActiveClipId(firstSplitClipId)
          console.log(
            'Split completed, focused on first split clip:',
            firstSplitClipId
          )
        } else {
          console.log('Split completed, but could not get first split clip ID')
        }
      }, 100) // 상태 업데이트 완료 대기
    } catch (error) {
      console.error('클립 나누기 오류:', error)
      showToast(
        error instanceof Error
          ? error.message
          : '클립 나누기 중 오류가 발생했습니다.'
      )
    }
  }, [activeClipId, clips, setClips, editorHistory, setActiveClipId])

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    if (editorHistory.canUndo()) {
      editorHistory.undo()
    }
  }, [editorHistory])

  const handleRedo = useCallback(() => {
    if (editorHistory.canRedo()) {
      editorHistory.redo()
    }
  }, [editorHistory])

  // Delete clip handler
  const handleDeleteClip = useCallback(() => {
    try {
      if (!activeClipId) {
        showToast('삭제할 클립을 선택해주세요.')
        return
      }

      // 클립이 1개뿐이면 삭제 불가
      if (clips.length <= 1) {
        showToast('마지막 클립은 삭제할 수 없습니다.')
        return
      }

      // 삭제할 클립 찾기
      const targetClipIndex = clips.findIndex(
        (clip) => clip.id === activeClipId
      )
      if (targetClipIndex === -1) {
        showToast('삭제할 클립을 찾을 수 없습니다.')
        return
      }

      // 클립 삭제 실행 - Command 패턴 사용
      const command = new DeleteClipCommand(clips, activeClipId, setClips)
      editorHistory.executeCommand(command)

      // 자동 포커스 스킵 설정 및 적절한 클립에 포커스
      setSkipAutoFocus(true)

      // 삭제 후 포커스 이동: 다음 클립이 있으면 다음, 없으면 이전 클립
      let nextFocusIndex = targetClipIndex
      if (targetClipIndex >= clips.length - 1) {
        // 마지막 클립을 삭제한 경우, 이전 클립으로 포커스
        nextFocusIndex = Math.max(0, targetClipIndex - 1)
      }

      // 새로운 클립 목록에서 포커스할 클립 ID 찾기
      setTimeout(() => {
        const updatedClips = clips.filter((clip) => clip.id !== activeClipId)
        if (updatedClips.length > 0 && nextFocusIndex < updatedClips.length) {
          setActiveClipId(updatedClips[nextFocusIndex].id)
          console.log(
            'Delete completed, focused on clip at index:',
            nextFocusIndex
          )
        }
      }, 0)

      showToast('클립이 삭제되었습니다.', 'success')
    } catch (error) {
      console.error('클립 삭제 오류:', error)
      showToast(
        error instanceof Error
          ? error.message
          : '클립 삭제 중 오류가 발생했습니다.'
      )
    }
  }, [activeClipId, clips, setClips, editorHistory, setActiveClipId])

  // Copy clips handler
  const handleCopyClips = useCallback(() => {
    try {
      const selectedIds = Array.from(selectedClipIds)

      if (selectedIds.length === 0) {
        showToast('복사할 클립을 선택해주세요.')
        return
      }

      // Create and execute copy command
      const command = new CopyClipsCommand(clips, selectedIds, setClipboard)

      command.execute() // Copy command doesn't need undo/redo
      showToast(`${selectedIds.length}개 클립을 복사했습니다.`, 'success')
    } catch (error) {
      console.error('클립 복사 오류:', error)
      showToast('클립 복사 중 오류가 발생했습니다.')
    }
  }, [clips, selectedClipIds, setClipboard])

  // Paste clips handler
  const handlePasteClips = useCallback(() => {
    try {
      if (clipboard.length === 0) {
        showToast('붙여넣을 클립이 없습니다.')
        return
      }

      // Create and execute paste command
      const command = new PasteClipsCommand(clips, clipboard, setClips)

      editorHistory.executeCommand(command)

      // 자동 포커스 스킵 설정 및 붙여넣은 마지막 클립에 포커스
      setSkipAutoFocus(true)
      setTimeout(() => {
        // 붙여넣은 클립들은 기존 클립들 뒤에 추가되므로
        // 마지막에 붙여넣은 클립에 포커스
        const newTotalClips = clips.length + clipboard.length
        if (newTotalClips > clips.length) {
          const lastPastedIndex = newTotalClips - 1
          // 실제로는 붙여넣은 클립들의 새 ID를 알아야 함
          console.log(
            'Paste completed, should focus on last pasted clip at index:',
            lastPastedIndex
          )
          // PasteClipsCommand에서 생성된 클립 ID들을 반환받아서 마지막 클립에 포커스해야 함
        }
      }, 0)

      showToast(`${clipboard.length}개 클립을 붙여넣었습니다.`, 'success')
    } catch (error) {
      console.error('클립 붙여넣기 오류:', error)
      showToast('클립 붙여넣기 중 오류가 발생했습니다.')
    }
  }, [clips, clipboard, setClips, editorHistory])

  // 원본 복원 핸들러
  const handleRestore = useCallback(() => {
    setShowRestoreModal(true)
  }, [])

  const handleConfirmRestore = useCallback(() => {
    restoreOriginalClips()
    clearSelection()
    setActiveClipId(null)
    setShowRestoreModal(false)
    showToast('원본으로 복원되었습니다.', 'success')
  }, [restoreOriginalClips, clearSelection, setActiveClipId])

  // 프로젝트 저장 핸들러
  const handleSave = useCallback(() => {
    saveProject()
      .then(() => {
        editorHistory.markAsSaved()
        markAsSaved()
        showToast('프로젝트가 저장되었습니다.', 'success')
      })
      .catch((error) => {
        console.error('Save failed:', error)
        showToast('저장에 실패했습니다.', 'error')
      })
  }, [saveProject, editorHistory, markAsSaved])

  // 다른 프로젝트로 저장 핸들러
  const handleSaveAs = useCallback(() => {
    // TODO: 새로운 프로젝트 ID 생성 및 저장 로직 구현
    const newProjectId = `project_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    // 현재 프로젝트 데이터를 새 ID로 저장
    const autosaveManager = AutosaveManager.getInstance()
    const oldProjectId = autosaveManager.getProjectId()

    // 새 프로젝트로 설정
    autosaveManager.setProject(newProjectId, 'browser')

    saveProject()
      .then(() => {
        editorHistory.markAsSaved()
        markAsSaved()
        showToast(`새 프로젝트로 저장되었습니다. (${newProjectId})`, 'success')

        // 프로젝트 정보 업데이트
        projectInfoManager.notifyFileOpen('browser', 'newProject', {
          id: newProjectId,
          name: `Copy of Project ${new Date().toLocaleDateString()}`,
        })
      })
      .catch((error) => {
        // 실패 시 원래 프로젝트로 되돌리기
        if (oldProjectId) {
          autosaveManager.setProject(oldProjectId, 'browser')
        }
        console.error('Save as failed:', error)
        showToast('다른 이름으로 저장에 실패했습니다.', 'error')
      })
  }, [saveProject, editorHistory, markAsSaved])

  // 내보내기 모달 상태 변경 핸들러
  const handleExportModalStateChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      // 모달이 닫힐 때 강제 오픈 플래그 리셋
      setShouldOpenExportModal(false)
    }
  }, [])

  // Auto-save every 3 seconds
  useEffect(() => {
    if (!clips.length) return

    const autoSave = () => {
      saveProject().catch((error) => {
        console.error('Auto-save failed:', error)
      })
    }

    const interval = setInterval(autoSave, 3000)
    return () => clearInterval(interval)
  }, [clips, saveProject])

  // clips 변경 시 AutosaveManager에 알림
  useEffect(() => {
    const autosaveManager = AutosaveManager.getInstance()
    if (clips.length > 0) {
      autosaveManager.incrementChangeCounter()
    }
  }, [clips])

  // 키보드 단축키 처리 (macOS Command + Windows/Linux Ctrl 지원)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 입력 필드에서는 단축키 비활성화
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const cmdOrCtrl = event.metaKey || event.ctrlKey

      // Command/Ctrl+Z (undo)
      if (cmdOrCtrl && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        handleUndo()
      }
      // Command/Ctrl+Shift+Z (redo)
      else if (cmdOrCtrl && event.shiftKey && event.key === 'Z') {
        event.preventDefault()
        handleRedo()
      }
      // Command/Ctrl+Y (redo - 대체 단축키)
      else if (cmdOrCtrl && event.key === 'y') {
        event.preventDefault()
        handleRedo()
      }
      // Command/Ctrl+S (save)
      else if (cmdOrCtrl && event.key === 's') {
        event.preventDefault()
        saveProject()
          .then(() => {
            editorHistory.markAsSaved()
            markAsSaved()
            showToast('프로젝트가 저장되었습니다.', 'success')
          })
          .catch((error) => {
            console.error('Save failed:', error)
            showToast('저장에 실패했습니다.')
          })
      }
      // Command/Ctrl+E (merge clips) - 윈도우에서는 Ctrl+E
      else if (cmdOrCtrl && event.key === 'e') {
        event.preventDefault()
        handleMergeClips()
      }
      // Command/Ctrl+X (delete clips) - 윈도우에서는 Ctrl+X, Mac에서는 Command+X
      else if (cmdOrCtrl && event.key === 'x') {
        event.preventDefault()
        handleDeleteClip()
      }
      // Command/Ctrl+C (copy clips)
      else if (cmdOrCtrl && event.key === 'c') {
        event.preventDefault()
        if (selectedClipIds.size > 0) {
          handleCopyClips()
        }
      }
      // Command/Ctrl+V (paste clips)
      else if (cmdOrCtrl && event.key === 'v') {
        event.preventDefault()
        if (clipboard.length > 0) {
          handlePasteClips()
        }
      }
      // Enter (split clip) - 포커싱된 클립 나누기
      else if (event.key === 'Enter' && !cmdOrCtrl) {
        event.preventDefault()
        handleSplitClip()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    handleUndo,
    handleRedo,
    saveProject,
    handleMergeClips,
    handleSplitClip,
    handleDeleteClip,
    handleCopyClips,
    handlePasteClips,
    selectedClipIds,
    clipboard,
    editorHistory,
    markAsSaved,
  ])

  // 에디터 진입 시 첫 번째 클립에 자동 포커스 및 패널 너비 복원
  useEffect(() => {
    if (clips.length > 0 && !activeClipId) {
      setActiveClipId(clips[0].id)
    }

    // Restore panel width from localStorage
    if (typeof window !== 'undefined') {
      const savedWidth = localStorage.getItem('editor-video-panel-width')
      if (savedWidth) {
        const width = parseInt(savedWidth, 10)
        if (!isNaN(width)) {
          setVideoPanelWidth(width)
        }
      }

      // Restore asset sidebar width from localStorage
      const savedAssetSidebarWidth = localStorage.getItem(
        'editor-asset-sidebar-width'
      )
      if (savedAssetSidebarWidth) {
        const width = parseInt(savedAssetSidebarWidth, 10)
        if (!isNaN(width)) {
          setAssetSidebarWidth(width)
        }
      }
    }
  }, [
    clips,
    activeClipId,
    setActiveClipId,
    setVideoPanelWidth,
    setAssetSidebarWidth,
  ])

  // 편집 모드 변경 시 사이드바 자동 설정
  useEffect(() => {
    if (editingMode === 'simple') {
      // 쉬운 편집 모드에서는 항상 템플릿 사이드바 표시
      setRightSidebarType('template')
    }
  }, [editingMode, setRightSidebarType])

  // 에디터 페이지 진입 시 튜토리얼 모달 표시 (첫 방문자용)
  useEffect(() => {
    // TODO: localStorage 대신 DB에서 사용자의 튜토리얼 완료 상태를 확인하도록 변경
    // - 사용자 인증 상태 확인 후 API 호출
    // - GET /api/user/tutorial-status 또는 사용자 프로필에서 튜토리얼 완료 여부 확인
    // - 로그인하지 않은 사용자의 경우 localStorage 사용 (임시)
    // - 튜토리얼 타입별 완료 상태 관리 (editor, upload, export 등)
    const hasSeenEditorTutorial = localStorage.getItem('hasSeenEditorTutorial')
    if (!hasSeenEditorTutorial && clips.length > 0) {
      setShowTutorialModal(true)
    }
  }, [clips])

  const handleTutorialClose = () => {
    // TODO: localStorage 대신 DB에 튜토리얼 완료 상태 저장하도록 변경
    // - POST /api/user/tutorial-status API 호출
    // - 사용자가 로그인된 경우 DB에 저장, 미로그인 시 localStorage 사용
    // - 튜토리얼 완료 날짜/시간, 완료 단계도 함께 저장
    setShowTutorialModal(false)
    localStorage.setItem('hasSeenEditorTutorial', 'true')
  }

  const handleTutorialComplete = () => {
    console.log('Editor tutorial completed!')
  }

  // Toolbar toggle handler
  const handleToolbarToggle = () => {
    setIsToolbarVisible(!isToolbarVisible)
  }

  // Show toolbar handler
  const handleShowToolbar = () => {
    setIsToolbarVisible(true)
  }

  // Window resize handler to update max width constraint
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      // Adjust video panel width if it exceeds new max
      const maxWidth = window.innerWidth / 2
      if (videoPanelWidth > maxWidth) {
        setVideoPanelWidth(maxWidth)
      }

      // Adjust asset sidebar width if it exceeds new max
      if (assetSidebarWidth > maxWidth) {
        setAssetSidebarWidth(maxWidth)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [
    videoPanelWidth,
    setVideoPanelWidth,
    assetSidebarWidth,
    setAssetSidebarWidth,
  ])

  // 클립이 변경되었을 때 포커스 유지/이동 로직
  useEffect(() => {
    if (clips.length === 0) {
      setActiveClipId(null)
      return
    }

    // 자동 포커스 스킵이 설정된 경우 리셋하고 건너뛰기
    if (skipAutoFocus) {
      setSkipAutoFocus(false)
      return
    }

    // 현재 포커싱된 클립이 없거나 존재하지 않으면 첫 번째 클립에 포커스
    if (!activeClipId || !clips.find((clip) => clip.id === activeClipId)) {
      setActiveClipId(clips[0].id)
    }
  }, [clips, activeClipId, setActiveClipId, skipAutoFocus])

  // 복구 중일 때 로딩 화면 표시 (임시 비활성화)
  if (isRecovering) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingSpinner
          size="lg"
          message="세션을 복구하고 있습니다..."
          showLogo={true}
          variant="fullscreen"
        />
      </div>
    )
  }

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(event) => {
        // Handle both clip and word drag start
        if (event.active.data.current?.type === 'word') {
          handleWordDragStart(event)
        } else {
          handleDragStart(event)
        }
      }}
      onDragOver={(event) => {
        // Handle both clip and word drag over
        if (event.active.data.current?.type === 'word') {
          handleWordDragOver(event)
        } else {
          handleDragOver(event)
        }
      }}
      onDragEnd={(event) => {
        // Handle both clip and word drag end
        if (event.active.data.current?.type === 'word') {
          handleWordDragEnd(event)
        } else {
          handleDragEnd(event)
        }
      }}
      onDragCancel={(event) => {
        // Handle both clip and word drag cancel
        if (event.active.data.current?.type === 'word') {
          handleWordDragCancel()
        } else {
          handleDragCancel()
        }
      }}
    >
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <EditorHeaderTabs
          activeTab={activeTab}
          onTabChange={(tabId: string) => setActiveTab(tabId as EditorTab)}
          isToolbarVisible={isToolbarVisible}
          onToolbarToggle={handleToolbarToggle}
          onShowToolbar={handleShowToolbar}
        />

        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isToolbarVisible ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {editingMode === 'advanced' ? (
            <Toolbars
              activeTab={activeTab}
              clips={clips}
              selectedClipIds={selectedClipIds}
              activeClipId={activeClipId}
              canUndo={editorHistory.canUndo()}
              canRedo={editorHistory.canRedo()}
              onSelectionChange={setSelectedClipIds}
              onNewClick={() => setIsUploadModalOpen(true)}
              onMergeClips={handleMergeClips}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onCut={undefined}
              onCopy={handleCopyClips}
              onPaste={handlePasteClips}
              onSplitClip={handleSplitClip}
              onRestore={handleRestore}
              onToggleAnimationSidebar={handleToggleAnimationSidebar}
              onToggleTemplateSidebar={handleToggleTemplateSidebar}
              onSave={handleSave}
              onSaveAs={handleSaveAs}
              forceOpenExportModal={shouldOpenExportModal}
              onExportModalStateChange={handleExportModalStateChange}
            />
          ) : (
            <SimpleToolbar
              activeClipId={activeClipId}
              canUndo={editorHistory.canUndo()}
              canRedo={editorHistory.canRedo()}
              onNewClick={() => setIsUploadModalOpen(true)}
              onMergeClips={handleMergeClips}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onSplitClip={handleSplitClip}
              onToggleTemplateSidebar={handleToggleTemplateSidebar}
              onSave={handleSave}
              onSaveAs={handleSaveAs}
              forceOpenExportModal={shouldOpenExportModal}
              onExportModalStateChange={handleExportModalStateChange}
            />
          )}
        </div>

        <div
          className={`flex relative transition-all duration-300 ease-in-out ${
            isToolbarVisible
              ? 'h-[calc(100vh-176px)]' // ~56px for toolbar + ~120px for header tabs
              : 'h-[calc(100vh-120px)]' // Only header tabs
          }`}
        >
          <div
            className={`sticky top-0 transition-all duration-300 ease-in-out ${
              isToolbarVisible
                ? 'h-[calc(100vh-176px)]'
                : 'h-[calc(100vh-120px)]'
            }`}
          >
            <VideoSection width={videoPanelWidth} />
          </div>

          <ResizablePanelDivider
            orientation="vertical"
            onResize={handlePanelResize}
            className="z-10"
          />

          <div
            className="flex-1 flex justify-center relative overflow-y-auto custom-scrollbar"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onScroll={handleScroll}
            style={
              {
                '--scroll-progress': `${scrollProgress}%`,
              } as React.CSSProperties
            }
          >
            {editingMode === 'advanced' ? (
              <SubtitleEditList
                clips={clips}
                selectedClipIds={selectedClipIds}
                activeClipId={activeClipId}
                speakers={speakers}
                speakerColors={speakerColors}
                onClipSelect={handleClipSelect}
                onClipCheck={handleClipCheck}
                onWordEdit={handleWordEdit}
                onSpeakerChange={handleSpeakerChange}
                onBatchSpeakerChange={handleBatchSpeakerChange}
                onOpenSpeakerManagement={handleOpenSpeakerManagement}
                onAddSpeaker={handleAddSpeaker}
                onRenameSpeaker={handleRenameSpeaker}
                onEmptySpaceClick={handleEmptySpaceClick}
              />
            ) : (
              <div className="flex-1 bg-white p-4 flex flex-col overflow-y-auto items-center">
                <div className="w-full max-w-[600px]">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    자막 타임라인
                  </h2>
                  <div className="space-y-2">
                    {clips.slice(0, 20).map((clip) => {
                      const isActive = clip.id === activeClipId
                      const formatTime = (seconds: number) => {
                        const mins = Math.floor(seconds / 60)
                        const secs = Math.floor(seconds % 60)
                        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
                      }

                      // Calculate start and end times from words
                      const startTime =
                        clip.words.length > 0 ? clip.words[0].start : 0
                      const endTime =
                        clip.words.length > 0
                          ? clip.words[clip.words.length - 1].end
                          : 0

                      return (
                        <TimelineClipCard
                          key={clip.id}
                          clip={clip}
                          isActive={isActive}
                          startTime={startTime}
                          endTime={endTime}
                          speakers={speakers}
                          speakerColors={speakerColors}
                          onClipSelect={handleClipSelect}
                          onSpeakerChange={handleSpeakerChange}
                          onAddSpeaker={handleAddSpeaker}
                          onRenameSpeaker={handleRenameSpeaker}
                          onOpenSpeakerManagement={handleOpenSpeakerManagement}
                          formatTime={formatTime}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            <SelectionBox
              startX={selectionBox.startX}
              startY={selectionBox.startY}
              endX={selectionBox.endX}
              endY={selectionBox.endY}
              isSelecting={isSelecting}
            />
          </div>

          {/* Right Sidebar - 슬라이드 애니메이션과 함께 */}
          <div
            className={`transition-all duration-300 ease-out overflow-hidden ${
              rightSidebarType
                ? `w-[${assetSidebarWidth}px] opacity-100`
                : 'w-0 opacity-0'
            }`}
            style={{
              width: rightSidebarType ? `${assetSidebarWidth}px` : '0px',
            }}
          >
            <div className="flex h-full">
              {rightSidebarType && (
                <>
                  <ResizablePanelDivider
                    orientation="vertical"
                    onResize={handleAssetSidebarResize}
                    className="z-10"
                  />

                  {/* Animation Asset Sidebar */}
                  {rightSidebarType === 'animation' && (
                    <div
                      className={`transform transition-all duration-300 ease-out w-full ${
                        rightSidebarType === 'animation'
                          ? 'translate-x-0 opacity-100'
                          : 'translate-x-full opacity-0'
                      }`}
                    >
                      <AnimationAssetSidebar
                        onAssetSelect={(asset) => {
                          console.log('Asset selected in editor:', asset)
                          // TODO: Apply asset effect to focused clip
                        }}
                        onClose={handleCloseSidebar}
                      />
                    </div>
                  )}

                  {/* Template Sidebar */}
                  {rightSidebarType === 'template' && (
                    <div
                      className={`transform transition-all duration-300 ease-out w-full ${
                        rightSidebarType === 'template'
                          ? 'translate-x-0 opacity-100'
                          : 'translate-x-full opacity-0'
                      }`}
                    >
                      <TemplateSidebar
                        onTemplateSelect={(template) => {
                          console.log('Template selected in editor:', template)
                          // TODO: Apply template to focused clip
                        }}
                        onClose={handleCloseSidebar}
                      />
                    </div>
                  )}

                  {/* Speaker Management Sidebar */}
                  {rightSidebarType === 'speaker' && (
                    <div
                      className={`sticky top-0 transition-all duration-300 ease-out transform w-full ${
                        isToolbarVisible
                          ? 'h-[calc(100vh-176px)]'
                          : 'h-[calc(100vh-120px)]'
                      } ${
                        rightSidebarType === 'speaker'
                          ? 'translate-x-0 opacity-100'
                          : 'translate-x-full opacity-0'
                      }`}
                    >
                      <SpeakerManagementSidebar
                        isOpen={rightSidebarType === 'speaker'}
                        onClose={handleCloseSidebar}
                        speakers={speakers}
                        clips={clips}
                        speakerColors={speakerColors}
                        onAddSpeaker={handleAddSpeaker}
                        onRemoveSpeaker={handleRemoveSpeaker}
                        onRenameSpeaker={handleRenameSpeaker}
                        onBatchSpeakerChange={handleBatchSpeakerChange}
                        onSpeakerColorChange={handleSpeakerColorChange}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <NewUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => !isTranscriptionLoading && setIsUploadModalOpen(false)}
          onFileSelect={(files: File[]) => {
            // Convert File[] to FileList for compatibility
            const fileList = new DataTransfer()
            files.forEach((file) => fileList.items.add(file))
            handleFileSelect(fileList.files)
          }}
          onStartTranscription={wrappedHandleStartTranscription}
          acceptedTypes={['audio/*', 'video/*']}
          maxFileSize={100 * 1024 * 1024} // 100MB
          multiple={true}
          isLoading={isTranscriptionLoading}
        />

        <TutorialModal
          isOpen={showTutorialModal}
          onClose={handleTutorialClose}
          onComplete={handleTutorialComplete}
        />

        {/* 원본 복원 확인 모달 */}
        <AlertDialog
          isOpen={showRestoreModal}
          title="원본으로 복원"
          description="원본으로 돌아가시겠습니까? 모든 변경사항이 초기화됩니다."
          variant="warning"
          primaryActionLabel="예"
          cancelActionLabel="아니오"
          onPrimaryAction={handleConfirmRestore}
          onCancel={() => setShowRestoreModal(false)}
          onClose={() => setShowRestoreModal(false)}
        />

        {/* Drag overlay for word drag and drop */}
        <DragOverlay>
          {(() => {
            const { draggedWordId, clips, groupedWordIds } =
              useEditorStore.getState()
            if (!draggedWordId) return null

            const draggedWord = clips
              .flatMap((clip) => clip.words)
              .find((word) => word.id === draggedWordId)

            if (!draggedWord) return null

            return (
              <div className="bg-blue-500 text-white px-2 py-1 rounded text-sm shadow-lg opacity-90">
                {groupedWordIds.size > 1
                  ? `${groupedWordIds.size} words`
                  : draggedWord.text}
              </div>
            )
          })()}
        </DragOverlay>
      </div>
    </DndContext>
  )
}
