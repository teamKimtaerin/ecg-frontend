/**
 * IndexedDB 기반 프로젝트 저장 시스템
 * localStorage의 용량 제한을 해결하고 대용량 자막 데이터 지원
 */

import {
  ProjectData,
  SavedProject,
  ProjectStorage,
} from '@/app/(route)/editor/types/project'
import { getTimestamp } from '@/utils/logger'

const DB_NAME = 'ECGMediaStorage' // mediaStorage와 동일한 DB 사용
const PROJECTS_STORE = 'projects'
const PROJECT_HISTORY_STORE = 'projectHistory'

export interface ProjectHistoryEntry {
  projectId: string
  timestamp: number
  action: string
  data: unknown
  changeCount: number
}

class IndexedDBProjectStorage implements ProjectStorage {
  private db: IDBDatabase | null = null

  /**
   * IndexedDB 초기화 (mediaStorage와 동일한 DB 사용)
   */
  async initialize(): Promise<void> {
    if (this.db) return // 이미 초기화됨

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 2) // Version 2 with new stores

      request.onerror = () => {
        console.error(
          `[${getTimestamp()}] indexedDBProjectStorage.ts Failed to open IndexedDB`
        )
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log(
          `[${getTimestamp()}] indexedDBProjectStorage.ts IndexedDB initialized successfully`
        )
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 프로젝트 데이터 저장소 생성
        if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
          const projectsStore = db.createObjectStore(PROJECTS_STORE, {
            keyPath: 'id',
          })
          projectsStore.createIndex('name', 'name', { unique: false })
          projectsStore.createIndex('updatedAt', 'updatedAt', { unique: false })
          projectsStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // 프로젝트 히스토리 저장소 생성
        if (!db.objectStoreNames.contains(PROJECT_HISTORY_STORE)) {
          const historyStore = db.createObjectStore(PROJECT_HISTORY_STORE, {
            keyPath: ['projectId', 'timestamp'],
          })
          historyStore.createIndex('projectId', 'projectId', { unique: false })
          historyStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        console.log(
          `[${getTimestamp()}] indexedDBProjectStorage.ts Database schema created/updated`
        )
      }
    })
  }

  /**
   * 프로젝트 저장
   */
  async saveProject(project: ProjectData): Promise<void> {
    if (!this.db) await this.initialize()

    // 저장 시간 업데이트
    const updatedProject = {
      ...project,
      updatedAt: new Date(),
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROJECTS_STORE], 'readwrite')
      const store = transaction.objectStore(PROJECTS_STORE)
      const request = store.put(updatedProject)

      request.onsuccess = () => {
        // console.log(
        //   `[${getTimestamp()}] indexedDBProjectStorage.ts Project "${project.name}" saved successfully`
        // )
        resolve()
      }

      request.onerror = () => {
        console.error(
          `[${getTimestamp()}] indexedDBProjectStorage.ts Failed to save project`
        )
        reject(new Error('프로젝트 저장에 실패했습니다.'))
      }
    })
  }

  /**
   * 프로젝트 로드
   */
  async loadProject(id: string): Promise<ProjectData | null> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROJECTS_STORE], 'readonly')
      const store = transaction.objectStore(PROJECTS_STORE)
      const request = store.get(id)

      request.onsuccess = () => {
        const project = request.result
        if (project) {
          // Date 객체 복원
          project.createdAt = new Date(project.createdAt)
          project.updatedAt = new Date(project.updatedAt)

          console.log(
            `[${getTimestamp()}] indexedDBProjectStorage.ts Project "${project.name}" loaded successfully`
          )
          resolve(project)
        } else {
          resolve(null)
        }
      }

      request.onerror = () => {
        console.error(
          `[${getTimestamp()}] indexedDBProjectStorage.ts Failed to load project`
        )
        reject(new Error('프로젝트 불러오기에 실패했습니다.'))
      }
    })
  }

  /**
   * 프로젝트 목록 조회
   */
  async listProjects(): Promise<SavedProject[]> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROJECTS_STORE], 'readonly')
      const store = transaction.objectStore(PROJECTS_STORE)
      const index = store.index('updatedAt')
      const request = index.openCursor(null, 'prev') // 최신순 정렬

      const projects: SavedProject[] = []

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const project = cursor.value as ProjectData
          projects.push({
            id: project.id,
            name: project.name,
            lastModified: new Date(project.updatedAt),
            size: this.calculateProjectSize(project),
          })
          cursor.continue()
        } else {
          console.log(
            `[${getTimestamp()}] indexedDBProjectStorage.ts Listed ${projects.length} projects`
          )
          resolve(projects)
        }
      }

      request.onerror = () => {
        console.error(
          `[${getTimestamp()}] indexedDBProjectStorage.ts Failed to list projects`
        )
        reject(new Error('프로젝트 목록 조회에 실패했습니다.'))
      }
    })
  }

  /**
   * 프로젝트 삭제
   */
  async deleteProject(id: string): Promise<void> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [PROJECTS_STORE, PROJECT_HISTORY_STORE],
        'readwrite'
      )

      // 프로젝트 데이터 삭제
      const projectStore = transaction.objectStore(PROJECTS_STORE)
      projectStore.delete(id)

      // 관련 히스토리 삭제
      const historyStore = transaction.objectStore(PROJECT_HISTORY_STORE)
      const historyIndex = historyStore.index('projectId')
      const historyRequest = historyIndex.openCursor(IDBKeyRange.only(id))

      historyRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        }
      }

      transaction.oncomplete = () => {
        console.log(
          `[${getTimestamp()}] indexedDBProjectStorage.ts Project ${id} deleted successfully`
        )
        resolve()
      }

      transaction.onerror = () => {
        console.error(
          `[${getTimestamp()}] indexedDBProjectStorage.ts Failed to delete project`
        )
        reject(new Error('프로젝트 삭제에 실패했습니다.'))
      }
    })
  }

  /**
   * 프로젝트 내보내기 (SRT/VTT/ASS 형식)
   */
  async exportProject(
    id: string,
    format: 'srt' | 'vtt' | 'ass'
  ): Promise<string> {
    const project = await this.loadProject(id)
    if (!project) {
      throw new Error('프로젝트를 찾을 수 없습니다.')
    }

    return this.convertToSubtitleFormat(project, format)
  }

  /**
   * 프로젝트 히스토리 저장 (undo/redo용)
   */
  async saveProjectHistory(
    projectId: string,
    action: string,
    data: unknown,
    changeCount: number = 1
  ): Promise<void> {
    if (!this.db) await this.initialize()

    const historyEntry: ProjectHistoryEntry = {
      projectId,
      timestamp: Date.now(),
      action,
      data,
      changeCount,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [PROJECT_HISTORY_STORE],
        'readwrite'
      )
      const store = transaction.objectStore(PROJECT_HISTORY_STORE)
      const request = store.add(historyEntry)

      request.onsuccess = () => {
        // 오래된 히스토리 정리 (최대 100개 유지)
        this.cleanupOldHistory(projectId, 100)
        resolve()
      }

      request.onerror = () => {
        console.error(
          `[${getTimestamp()}] indexedDBProjectStorage.ts Failed to save project history`
        )
        reject(new Error('프로젝트 히스토리 저장에 실패했습니다.'))
      }
    })
  }

  /**
   * 원본 클립 데이터 저장 (세션 간 유지)
   */
  async saveOriginalClips(
    projectId: string,
    originalClips: unknown[]
  ): Promise<void> {
    const project = await this.loadProject(projectId)
    if (project) {
      project.originalClips = originalClips
      await this.saveProject(project)
    }
  }

  /**
   * 원본 클립 데이터 로드
   */
  async loadOriginalClips(projectId: string): Promise<unknown[] | null> {
    const project = await this.loadProject(projectId)
    return project?.originalClips || null
  }

  // Private helper methods
  private calculateProjectSize(project: ProjectData): number {
    // JSON 직렬화된 크기 추정
    return new Blob([JSON.stringify(project)]).size
  }

  private convertToSubtitleFormat(
    project: ProjectData,
    format: 'srt' | 'vtt' | 'ass'
  ): string {
    switch (format) {
      case 'srt':
        return this.convertToSRT(project)
      case 'vtt':
        return this.convertToVTT(project)
      case 'ass':
        return this.convertToASS(project)
      default:
        throw new Error('지원하지 않는 형식입니다.')
    }
  }

  private convertToSRT(project: ProjectData): string {
    let srt = ''
    project.clips.forEach((clip, index) => {
      const startTime = this.formatSRTTime(clip.words[0]?.start || 0)
      const endTime = this.formatSRTTime(
        clip.words[clip.words.length - 1]?.end || 0
      )

      srt += `${index + 1}\n`
      srt += `${startTime} --> ${endTime}\n`
      srt += `${clip.fullText}\n\n`
    })
    return srt
  }

  private convertToVTT(project: ProjectData): string {
    // cSpell:ignore WEBVTT
    let vtt = 'WEBVTT\n\n'
    project.clips.forEach((clip) => {
      const startTime = this.formatVTTTime(clip.words[0]?.start || 0)
      const endTime = this.formatVTTTime(
        clip.words[clip.words.length - 1]?.end || 0
      )

      vtt += `${startTime} --> ${endTime}\n`
      vtt += `${clip.fullText}\n\n`
    })
    return vtt
  }

  private convertToASS(project: ProjectData): string {
    // cSpell:ignore Fontname Colour Hffffff
    let ass = '[Script Info]\nTitle: ECG Export\nScriptType: v4.00+\n\n'
    ass +=
      '[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n'
    ass +=
      'Style: Default,Arial,20,&Hffffff,&Hffffff,&H0,&H0,0,0,0,0,100,100,0,0,1,0,0,2,10,10,10,1\n\n'
    ass +=
      '[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n'

    project.clips.forEach((clip) => {
      const startTime = this.formatASSTime(clip.words[0]?.start || 0)
      const endTime = this.formatASSTime(
        clip.words[clip.words.length - 1]?.end || 0
      )

      ass += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${clip.fullText}\n`
    })
    return ass
  }

  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms
      .toString()
      .padStart(3, '0')}`
  }

  private formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms
      .toString()
      .padStart(3, '0')}`
  }

  private formatASSTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const cs = Math.floor((seconds % 1) * 100) // cSpell:ignore centiseconds
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}.${cs.toString().padStart(2, '0')}`
  }

  private async cleanupOldHistory(
    projectId: string,
    maxEntries: number
  ): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction(
      [PROJECT_HISTORY_STORE],
      'readwrite'
    )
    const store = transaction.objectStore(PROJECT_HISTORY_STORE)
    const index = store.index('projectId')
    const request = index.openCursor(IDBKeyRange.only(projectId), 'prev')

    let count = 0
    const toDelete: IDBValidKey[] = []

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        count++
        if (count > maxEntries) {
          toDelete.push(cursor.primaryKey)
        }
        cursor.continue()
      } else {
        // 초과된 항목들 삭제
        toDelete.forEach((key) => {
          store.delete(key)
        })
      }
    }
  }
}

// Singleton instance
export const indexedDBProjectStorage = new IndexedDBProjectStorage()

// 타입 확장을 위해 ProjectData에 originalClips 추가
declare module '@/app/(route)/editor/types/project' {
  interface ProjectData {
    originalClips?: unknown[] // 원본 클립 데이터 (세션 간 유지)
  }
}
