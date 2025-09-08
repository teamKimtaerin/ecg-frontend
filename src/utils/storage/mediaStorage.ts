/**
 * IndexedDB 기반 미디어 저장 시스템
 */

import { getTimestamp } from '@/utils/logger'

const DB_NAME = 'ECGMediaStorage'
const DB_VERSION = 1
const MEDIA_STORE = 'media'
const PROJECT_MEDIA_STORE = 'projectMedia'

export interface MediaFile {
  id: string
  projectId: string
  fileName: string
  fileType: string
  fileSize: number
  blob: Blob
  duration?: number
  videoCodec?: string
  audioCodec?: string
  videoSize?: string
  frameRate?: number
  createdAt: Date
  lastAccessed: Date
}

export interface ProjectMediaInfo {
  projectId: string
  mediaId: string
  mediaUrl?: string // Blob URL for current session
  fileName: string
  fileType: string
  fileSize: number
  duration?: number
  metadata?: {
    videoCodec?: string
    audioCodec?: string
    videoSize?: string
    frameRate?: number
  }
}

class MediaStorage {
  private db: IDBDatabase | null = null
  private blobUrls: Map<string, string> = new Map()

  /**
   * IndexedDB 초기화
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error(
          `[${getTimestamp()}] mediaStorage.ts Failed to open IndexedDB`
        )
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log(
          `[${getTimestamp()}] mediaStorage.ts IndexedDB initialized successfully`
        )
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 미디어 파일 저장소
        if (!db.objectStoreNames.contains(MEDIA_STORE)) {
          const mediaStore = db.createObjectStore(MEDIA_STORE, {
            keyPath: 'id',
          })
          mediaStore.createIndex('projectId', 'projectId', { unique: false })
          mediaStore.createIndex('fileName', 'fileName', { unique: false })
        }

        // 프로젝트-미디어 연결 정보 저장소
        if (!db.objectStoreNames.contains(PROJECT_MEDIA_STORE)) {
          db.createObjectStore(PROJECT_MEDIA_STORE, {
            keyPath: 'projectId',
          })
        }

        console.log(
          `[${getTimestamp()}] mediaStorage.ts Database schema created/updated`
        )
      }
    })
  }

  /**
   * 비디오 파일 저장
   */
  async saveMedia(
    projectId: string,
    file: File,
    metadata?: Partial<MediaFile>
  ): Promise<string> {
    if (!this.db) await this.initialize()

    const mediaId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    const mediaFile: MediaFile = {
      id: mediaId,
      projectId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      blob: file,
      createdAt: new Date(),
      lastAccessed: new Date(),
      ...metadata,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEDIA_STORE], 'readwrite')
      const store = transaction.objectStore(MEDIA_STORE)
      const request = store.add(mediaFile)

      request.onsuccess = () => {
        console.log(
          `[${getTimestamp()}] mediaStorage.ts Media saved: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
        )
        resolve(mediaId)
      }

      request.onerror = () => {
        console.error(
          `[${getTimestamp()}] mediaStorage.ts Failed to save media`
        )
        reject(new Error('Failed to save media'))
      }
    })
  }

  /**
   * 비디오 파일 로드
   */
  async loadMedia(mediaId: string): Promise<MediaFile | null> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEDIA_STORE], 'readonly')
      const store = transaction.objectStore(MEDIA_STORE)
      const request = store.get(mediaId)

      request.onsuccess = () => {
        const media = request.result
        if (media) {
          // Update last accessed time
          this.updateLastAccessed(mediaId)
          console.log(
            `[${getTimestamp()}] mediaStorage.ts Media loaded: ${media.fileName}`
          )
          resolve(media)
        } else {
          resolve(null)
        }
      }

      request.onerror = () => {
        console.error(
          `[${getTimestamp()}] mediaStorage.ts Failed to load media`
        )
        reject(new Error('Failed to load media'))
      }
    })
  }

  /**
   * 프로젝트의 미디어 정보 저장
   */
  async saveProjectMedia(projectMediaInfo: ProjectMediaInfo): Promise<void> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [PROJECT_MEDIA_STORE],
        'readwrite'
      )
      const store = transaction.objectStore(PROJECT_MEDIA_STORE)
      const request = store.put(projectMediaInfo)

      request.onsuccess = () => {
        console.log(
          `[${getTimestamp()}] mediaStorage.ts Project media info saved for: ${projectMediaInfo.projectId}`
        )
        resolve()
      }

      request.onerror = () => {
        console.error(
          `[${getTimestamp()}] mediaStorage.ts Failed to save project media info`
        )
        reject(new Error('Failed to save project media info'))
      }
    })
  }

  /**
   * 프로젝트의 미디어 정보 로드
   */
  async loadProjectMedia(projectId: string): Promise<ProjectMediaInfo | null> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [PROJECT_MEDIA_STORE],
        'readonly'
      )
      const store = transaction.objectStore(PROJECT_MEDIA_STORE)
      const request = store.get(projectId)

      request.onsuccess = () => {
        const projectMedia = request.result
        if (projectMedia) {
          console.log(
            `[${getTimestamp()}] mediaStorage.ts Project media info loaded for: ${projectId}`
          )
        }
        resolve(projectMedia || null)
      }

      request.onerror = () => {
        console.error(
          `[${getTimestamp()}] mediaStorage.ts Failed to load project media info`
        )
        reject(new Error('Failed to load project media info'))
      }
    })
  }

  /**
   * Blob URL 생성 및 캐싱
   */
  async createBlobUrl(mediaId: string): Promise<string | null> {
    // 이미 생성된 URL이 있으면 반환
    if (this.blobUrls.has(mediaId)) {
      return this.blobUrls.get(mediaId)!
    }

    const media = await this.loadMedia(mediaId)
    if (!media) return null

    const blobUrl = URL.createObjectURL(media.blob)
    this.blobUrls.set(mediaId, blobUrl)

    console.log(
      `[${getTimestamp()}] mediaStorage.ts Blob URL created for: ${media.fileName}`
    )

    return blobUrl
  }

  /**
   * Blob URL 해제
   */
  revokeBlobUrl(mediaId: string): void {
    const url = this.blobUrls.get(mediaId)
    if (url) {
      URL.revokeObjectURL(url)
      this.blobUrls.delete(mediaId)
      console.log(
        `[${getTimestamp()}] mediaStorage.ts Blob URL revoked for media: ${mediaId}`
      )
    }
  }

  /**
   * 모든 Blob URL 해제
   */
  revokeAllBlobUrls(): void {
    this.blobUrls.forEach((url, mediaId) => {
      URL.revokeObjectURL(url)
      console.log(
        `[${getTimestamp()}] mediaStorage.ts Blob URL revoked for media: ${mediaId}`
      )
    })
    this.blobUrls.clear()
  }

  /**
   * 마지막 접근 시간 업데이트
   */
  private async updateLastAccessed(mediaId: string): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction([MEDIA_STORE], 'readwrite')
    const store = transaction.objectStore(MEDIA_STORE)
    const request = store.get(mediaId)

    request.onsuccess = () => {
      const media = request.result
      if (media) {
        media.lastAccessed = new Date()
        store.put(media)
      }
    }
  }

  /**
   * 프로젝트의 모든 미디어 삭제
   */
  async deleteProjectMedia(projectId: string): Promise<void> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [MEDIA_STORE, PROJECT_MEDIA_STORE],
        'readwrite'
      )

      // Delete all media files for the project
      const mediaStore = transaction.objectStore(MEDIA_STORE)
      const index = mediaStore.index('projectId')
      const request = index.openCursor(IDBKeyRange.only(projectId))

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const mediaId = cursor.value.id
          // Revoke blob URL if exists
          this.revokeBlobUrl(mediaId)
          cursor.delete()
          cursor.continue()
        }
      }

      // Delete project media info
      const projectMediaStore = transaction.objectStore(PROJECT_MEDIA_STORE)
      projectMediaStore.delete(projectId)

      transaction.oncomplete = () => {
        console.log(
          `[${getTimestamp()}] mediaStorage.ts All media deleted for project: ${projectId}`
        )
        resolve()
      }

      transaction.onerror = () => {
        console.error(
          `[${getTimestamp()}] mediaStorage.ts Failed to delete project media`
        )
        reject(new Error('Failed to delete project media'))
      }
    })
  }

  /**
   * 저장 용량 정보 가져오기
   */
  async getStorageInfo(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      }
    }
    return { used: 0, quota: 0 }
  }

  /**
   * 오래된 미디어 정리 (30일 이상 접근하지 않은 파일)
   */
  async cleanupOldMedia(daysOld: number = 30): Promise<void> {
    if (!this.db) await this.initialize()

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEDIA_STORE], 'readwrite')
      const store = transaction.objectStore(MEDIA_STORE)
      const request = store.openCursor()

      let deletedCount = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const media = cursor.value as MediaFile
          if (media.lastAccessed < cutoffDate) {
            this.revokeBlobUrl(media.id)
            cursor.delete()
            deletedCount++
          }
          cursor.continue()
        }
      }

      transaction.oncomplete = () => {
        console.log(
          `[${getTimestamp()}] mediaStorage.ts Cleanup completed. Deleted ${deletedCount} old media files`
        )
        resolve()
      }

      transaction.onerror = () => {
        console.error(
          `[${getTimestamp()}] mediaStorage.ts Failed to cleanup old media`
        )
        reject(new Error('Failed to cleanup old media'))
      }
    })
  }
}

// Singleton instance
export const mediaStorage = new MediaStorage()

// Cleanup blob URLs when page unloads
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    mediaStorage.revokeAllBlobUrls()
  })
}
